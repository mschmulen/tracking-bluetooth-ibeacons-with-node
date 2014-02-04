#import <Foundation/Foundation.h>

#include <node_buffer.h>

#include "XpcConnection.h"

static v8::Persistent<v8::FunctionTemplate> s_ct;

class XpcEventData {
public:
  XpcConnection *xpcConnnection;
  xpc_object_t event;
};


void XpcConnection::Init(v8::Handle<v8::Object> target) {
  v8::HandleScope scope;

  v8::Local<v8::FunctionTemplate> t = v8::FunctionTemplate::New(XpcConnection::New);

  s_ct = v8::Persistent<v8::FunctionTemplate>::New(t);
  s_ct->InstanceTemplate()->SetInternalFieldCount(1);
  s_ct->SetClassName(v8::String::NewSymbol("XpcConnection"));

  NODE_SET_PROTOTYPE_METHOD(s_ct, "setup", XpcConnection::Setup);
  NODE_SET_PROTOTYPE_METHOD(s_ct, "sendMessage", XpcConnection::SendMessage);

  target->Set(v8::String::NewSymbol("XpcConnection"), s_ct->GetFunction());
}

XpcConnection::XpcConnection(std::string serviceName) : 
  node::ObjectWrap(),
  serviceName(serviceName) {
}

XpcConnection::~XpcConnection() {
}

void XpcConnection::setup() {
  this->dispatchQueue = dispatch_queue_create(this->serviceName.c_str(), 0);
  this->xpcConnnection = xpc_connection_create_mach_service(this->serviceName.c_str(), this->dispatchQueue, XPC_CONNECTION_MACH_SERVICE_PRIVILEGED);

  xpc_connection_set_event_handler(this->xpcConnnection, ^(xpc_object_t event) {
    xpc_retain(event);
//    NSLog(@"event = %@", event);
    this->handleEvent(event);
  });

  xpc_connection_resume(this->xpcConnnection);
}

void XpcConnection::sendMessage(xpc_object_t message) {
//  NSLog(@"sendMessage: message = %@", message);
  xpc_connection_send_message(this->xpcConnnection, message);
}

void XpcConnection::handleEvent(xpc_object_t event) {
  uv_work_t *req = new uv_work_t();

  XpcEventData* data = new XpcEventData;

  data->xpcConnnection = this;
  data->event = event;

  req->data = data;

  uv_queue_work(uv_default_loop(), req, XpcConnection::HandleEvent, XpcConnection::HandleEventAfter);
}

v8::Handle<v8::Value> XpcConnection::New(const v8::Arguments& args) {
  v8::HandleScope scope;
  std::string serviceName = "";

  if (args.Length() > 0) {
    v8::Handle<v8::Value> arg0 = args[0];
    if (arg0->IsString()) {
      v8::Handle<v8::String> arg0String = arg0->ToString();
      v8::String::AsciiValue arg0StringValue(arg0String);

      serviceName = *arg0StringValue;
    }
  }

  XpcConnection* p = new XpcConnection(serviceName);
  p->Wrap(args.This());
  p->This = v8::Persistent<v8::Object>::New(args.This());
  return args.This();
}


v8::Handle<v8::Value> XpcConnection::Setup(const v8::Arguments& args) {
  v8::HandleScope scope;
  XpcConnection* p = node::ObjectWrap::Unwrap<XpcConnection>(args.This());

  p->setup();

  return scope.Close(v8::Undefined());
}

xpc_object_t XpcConnection::ValueToXpcObject(v8::Handle<v8::Value> value) {
  xpc_object_t xpcObject = NULL;

  if (value->IsInt32() || value->IsUint32()) {
    xpcObject = xpc_int64_create(value->IntegerValue());
  } else if (value->IsString()) {
    v8::Handle<v8::String> valueString = value->ToString();
    v8::String::AsciiValue valueStringValue(valueString);

    xpcObject = xpc_string_create(*valueStringValue);
  } else if (value->IsArray()) {
    v8::Handle<v8::Array> valueArray = v8::Handle<v8::Array>::Cast(value);

    xpcObject = XpcConnection::ArrayToXpcObject(valueArray);
  } else if (node::Buffer::HasInstance(value)) {
    v8::Handle<v8::Object> valueObject = value->ToObject();

    if (valueObject->HasRealNamedProperty(v8::String::New("isUuid"))) {
      uuid_t *uuid = (uuid_t *)node::Buffer::Data(valueObject);

      xpcObject = xpc_uuid_create(*uuid);
    } else {
      xpcObject = xpc_data_create(node::Buffer::Data(valueObject), node::Buffer::Length(valueObject));
    }
  } else if (value->IsObject()) {
    v8::Handle<v8::Object> valueObject = value->ToObject();

    xpcObject = XpcConnection::ObjectToXpcObject(valueObject);
  } else {
    // NSLog(@"Could not convert value!");
  }

  return xpcObject;
}

xpc_object_t XpcConnection::ObjectToXpcObject(v8::Handle<v8::Object> object) {
  xpc_object_t xpcObject = xpc_dictionary_create(NULL, NULL, 0);

  v8::Handle<v8::Array> propertyNames = object->GetPropertyNames();

  for(uint32_t i = 0; i < propertyNames->Length(); i++) {
    v8::Handle<v8::Value> propertyName = propertyNames->Get(i);

    if (propertyName->IsString()) {
      v8::Handle<v8::String> propertyNameString = propertyName->ToString();
      v8::String::AsciiValue propertyNameStringValue(propertyNameString);
      v8::Handle<v8::Value> propertyValue = object->GetRealNamedProperty(propertyNameString);

      xpc_object_t xpcValue = XpcConnection::ValueToXpcObject(propertyValue);
      xpc_dictionary_set_value(xpcObject, *propertyNameStringValue, xpcValue);
      if (xpcValue) {
        xpc_release(xpcValue);
      }
    }
  }

  return xpcObject;
}

xpc_object_t XpcConnection::ArrayToXpcObject(v8::Handle<v8::Array> array) {
  xpc_object_t xpcArray = xpc_array_create(NULL, 0);

  for(uint32_t i = 0; i < array->Length(); i++) {
    v8::Handle<v8::Value> value = array->Get(i);
    
    xpc_object_t xpcValue = XpcConnection::ValueToXpcObject(value);
    xpc_array_append_value(xpcArray, xpcValue);
    if (xpcValue) {
      xpc_release(xpcValue);
    }
  }

  return xpcArray;
}

v8::Handle<v8::Value> XpcConnection::XpcObjectToValue(xpc_object_t xpcObject) {
  v8::Handle<v8::Value> value;

  xpc_type_t valueType = xpc_get_type(xpcObject);

  if (valueType == XPC_TYPE_INT64) {
    value = v8::Integer::New(xpc_int64_get_value(xpcObject));
  } else if(valueType == XPC_TYPE_STRING) {
    value = v8::String::New(xpc_string_get_string_ptr(xpcObject));
  } else if(valueType == XPC_TYPE_DICTIONARY) {
    value = XpcConnection::XpcDictionaryToObject(xpcObject);
  } else if(valueType == XPC_TYPE_ARRAY) {
    value = XpcConnection::XpcArrayToArray(xpcObject);
  } else if(valueType == XPC_TYPE_DATA) {
    node::Buffer *slowBuffer = node::Buffer::New((char *)xpc_data_get_bytes_ptr(xpcObject), xpc_data_get_length(xpcObject));

    v8::Handle<v8::Object> globalObj = v8::Context::GetCurrent()->Global();
    v8::Handle<v8::Function> bufferConstructor = v8::Local<v8::Function>::Cast(globalObj->Get(v8::String::New("Buffer")));

    v8::Handle<v8::Value> constructorArgs[3] = {
      slowBuffer->handle_,
      v8::Integer::New(xpc_data_get_length(xpcObject)),
      v8::Integer::New(0)
    };
    
    value = bufferConstructor->NewInstance(3, constructorArgs);
  } else if(valueType == XPC_TYPE_UUID) {
    node::Buffer *slowBuffer = node::Buffer::New((char *)xpc_uuid_get_bytes(xpcObject), sizeof(uuid_t));

    v8::Handle<v8::Object> globalObj = v8::Context::GetCurrent()->Global();
    v8::Handle<v8::Function> bufferConstructor = v8::Local<v8::Function>::Cast(globalObj->Get(v8::String::New("Buffer")));

    v8::Handle<v8::Value> constructorArgs[3] = {
      slowBuffer->handle_,
      v8::Integer::New(sizeof(uuid_t)),
      v8::Integer::New(0)
    };
    
    value = bufferConstructor->NewInstance(3, constructorArgs);
  } else {
    NSLog(@"XpcObjectToValue: Could not convert to value!, %@", xpcObject);
  }

  return value;
}

v8::Handle<v8::Object> XpcConnection::XpcDictionaryToObject(xpc_object_t xpcDictionary) {
  v8::Handle<v8::Object> object = v8::Object::New();

  xpc_dictionary_apply(xpcDictionary, ^bool(const char *key, xpc_object_t value) {
    object->Set(v8::String::New(key), XpcConnection::XpcObjectToValue(value));

    return true;
  });

  return object;
}

v8::Handle<v8::Array> XpcConnection::XpcArrayToArray(xpc_object_t xpcArray) {
  v8::Handle<v8::Array> array = v8::Array::New();

  xpc_array_apply(xpcArray, ^bool(size_t index, xpc_object_t value) {
    array->Set(v8::Number::New(index), XpcConnection::XpcObjectToValue(value));

    return true;
  });

  return array;
}

void XpcConnection::HandleEvent(uv_work_t* req) {
  // no-op
}

#if UV_VERSION_MINOR > 8
void XpcConnection::HandleEventAfter(uv_work_t* req, int status) {
#else
void XpcConnection::HandleEventAfter(uv_work_t* req) {
#endif
  v8::HandleScope scope;
  XpcEventData* data = static_cast<XpcEventData*>(req->data);
  XpcConnection::XpcConnection *xpcConnnection = data->xpcConnnection;
  xpc_object_t event = data->event;

  xpc_type_t eventType = xpc_get_type(event);
  if (eventType == XPC_TYPE_ERROR) {
    const char* message = "unknown";

    if (event == XPC_ERROR_CONNECTION_INTERRUPTED) {
      message = "connection interrupted";
    } else if (event == XPC_ERROR_CONNECTION_INVALID) {
      message = "connection invalid";
    }

    v8::Handle<v8::Value> argv[2] = {
      v8::String::New("error"),
      v8::String::New(message)
    };
    node::MakeCallback(xpcConnnection->This, "emit", 2, argv);
  } else if (eventType == XPC_TYPE_DICTIONARY) {
    // NSLog(@"HandleEventAfter: event = %@", event);
    v8::Handle<v8::Object> eventObject = XpcConnection::XpcDictionaryToObject(event);

    v8::Handle<v8::Value> argv[2] = {
      v8::String::New("event"),
      eventObject
    };
    node::MakeCallback(xpcConnnection->This, "emit", 2, argv);
  }

  xpc_release(event);
  delete data;
  delete req;
}

v8::Handle<v8::Value> XpcConnection::SendMessage(const v8::Arguments& args) {
  v8::HandleScope scope;
  XpcConnection* p = node::ObjectWrap::Unwrap<XpcConnection>(args.This());

  if (args.Length() > 0) {
    v8::Handle<v8::Value> arg0 = args[0];
    if (arg0->IsObject()) {
      v8::Handle<v8::Object> object = v8::Handle<v8::Object>::Cast(arg0);
   
      xpc_object_t message = XpcConnection::ObjectToXpcObject(object);
      p->sendMessage(message);
      xpc_release(message);
    }
  }

  return scope.Close(v8::Undefined());
}

extern "C" {

  static void init (v8::Handle<v8::Object> target) {
    XpcConnection::Init(target);
  }

  NODE_MODULE(binding, init);
}
