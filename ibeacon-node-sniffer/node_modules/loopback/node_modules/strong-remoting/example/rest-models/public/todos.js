// An example Backbone application contributed by
// [Jérôme Gravel-Niquet](http://jgn.me/). This demo uses a simple
// [LocalStorage adapter](backbone-localstorage.html)
// to persist Backbone models within your browser.

// Load the application once the DOM is ready, using `jQuery.ready`:
$(function(){

  // Remote REST Contract
  var contract = {
    routes: {
      'Todo.all': {verb: 'get', path: '/t'},
      'Todo.prototype.save': {verb: 'post', path: '/t/:id'},
      'Todo.prototype.fetch': {verb: 'get', path: '/t/:id'}
    }
  };
  
  // Remote Objects
  var remoteObjects = RemoteObjects.connect('http://localhost:3000', contract);

  // Todo Model
  // ----------

  // Our basic **Todo** model has `title`, `order`, and `done` attributes.
  var Todo = Backbone.Model.extend({

    // Default attributes for the todo item.
    defaults: function() {
      return {
        title: "empty todo...",
        order: Todos.nextOrder(),
        done: false
      };
    },

    // Toggle the `done` state of this todo item.
    toggle: function() {
      this.save({done: !this.get("done")});
    },
    
    save: function (data) {
      this.set(data);
      var remoteObj = remoteObjects.construct('Todo', {data: this.toJSON()});
      remoteObj.invoke('save', function () {
        // saved
      });
    }
  });

  // Todo Collection
  // ---------------

  // The collection of todos is backed a remote server.
  var TodoList = Backbone.Collection.extend({

    // Reference to this collection's model.
    model: Todo,

    // Filter down the list of all todo items that are finished.
    done: function() {
      return this.where({done: true});
    },

    // Filter down the list to only todo items that are still not finished.
    remaining: function() {
      return this.without.apply(this, this.done());
    },

    // We keep the Todos in sequential order, despite being saved by unordered
    // GUID in the database. This generates the next order number for new items.
    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },

    // Todos are sorted by their original insertion order.
    comparator: 'order',

    fetch: function () {
      var self = this;
      
      remoteObjects.invoke('Todo.all', null, null, function (err, data) {
        self.reset(data);
      });
    }
  });

  // Create our global collection of **Todos**.
  var Todos = new TodoList;

  // Todo Item View
  // --------------

  // The DOM element for a todo item...
  var TodoView = Backbone.View.extend({

    //... is a list tag.
    tagName:  "li",

    // Cache the template function for a single item.
    template: _.template($('#item-template').html()),

    // The DOM events specific to an item.
    events: {
      "click .toggle"   : "toggleDone",
      "dblclick .view"  : "edit",
      "click a.destroy" : "clear",
      "keypress .edit"  : "updateOnEnter",
      "blur .edit"      : "close"
    },

    // The TodoView listens for changes to its model, re-rendering. Since there's
    // a one-to-one correspondence between a **Todo** and a **TodoView** in this
    // app, we set a direct reference on the model for convenience.
    initialize: function() {
      this.listenTo(this.model, 'change', this.render);
      this.listenTo(this.model, 'destroy', this.remove);
    },

    // Re-render the titles of the todo item.
    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      this.$el.toggleClass('done', this.model.get('done'));
      this.input = this.$('.edit');
      return this;
    },

    // Toggle the `"done"` state of the model.
    toggleDone: function() {
      this.model.toggle();
    },

    // Switch this view into `"editing"` mode, displaying the input field.
    edit: function() {
      this.$el.addClass("editing");
      this.input.focus();
    },

    // Close the `"editing"` mode, saving changes to the todo.
    close: function() {
      var value = this.input.val();
      if (!value) {
        this.clear();
      } else {
        this.model.save({title: value});
        this.$el.removeClass("editing");
      }
    },

    // If you hit `enter`, we're through editing the item.
    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },

    // Remove the item, destroy the model.
    clear: function() {
      this.model.destroy();
    }

  });

  // The Application
  // ---------------

  // Our overall **AppView** is the top-level piece of UI.
  var AppView = Backbone.View.extend({

    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    el: $("#todoapp"),

    // Our template for the line of statistics at the bottom of the app.
    statsTemplate: _.template($('#stats-template').html()),

    // Delegated events for creating new items, and clearing completed ones.
    events: {
      "keypress #new-todo":  "createOnEnter",
      "click #clear-completed": "clearCompleted",
      "click #toggle-all": "toggleAllComplete"
    },

    // At initialization we bind to the relevant events on the `Todos`
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting todos that might be saved in *localStorage*.
    initialize: function() {

      this.input = this.$("#new-todo");
      this.allCheckbox = this.$("#toggle-all")[0];

      this.listenTo(Todos, 'add', this.addOne);
      this.listenTo(Todos, 'reset', this.addAll);
      this.listenTo(Todos, 'all', this.render);

      this.footer = this.$('footer');
      this.main = $('#main');

      Todos.fetch();
    },

    // Re-rendering the App just means refreshing the statistics -- the rest
    // of the app doesn't change.
    render: function() {
      var done = Todos.done().length;
      var remaining = Todos.remaining().length;

      if (Todos.length) {
        this.main.show();
        this.footer.show();
        this.footer.html(this.statsTemplate({done: done, remaining: remaining}));
      } else {
        this.main.hide();
        this.footer.hide();
      }

      this.allCheckbox.checked = !remaining;
    },

    // Add a single todo item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function(todo) {
      var view = new TodoView({model: todo});
      this.$("#todo-list").append(view.render().el);
    },

    // Add all items in the **Todos** collection at once.
    addAll: function() {
      Todos.each(this.addOne, this);
    },

    // If you hit return in the main input field, create new **Todo** model
    createOnEnter: function(e) {
      if (e.keyCode != 13) return;
      if (!this.input.val()) return;

      Todos.create({title: this.input.val()});
      this.input.val('');
    },

    // Clear all done todo items, destroying their models.
    clearCompleted: function() {
      _.invoke(Todos.done(), 'destroy');
      return false;
    },

    toggleAllComplete: function () {
      var done = this.allCheckbox.checked;
      Todos.each(function (todo) { todo.save({'done': done}); });
    }

  });

  // Finally, we kick things off by creating the **App**.
  var App = new AppView;

});

function RemoteObjects(url, contract) {
  this.url = url;
  this.contract = contract;
}

RemoteObjects.prototype.construct = function (name) {
  return new RemoteObject(Array.prototype.slice.call(arguments, 0), this);
}

RemoteObjects.prototype.invoke = function (methodString, ctorArgs, args, fn) {
  
  if(typeof ctorArgs === 'function') {
    fn = ctorArgs;
    ctorArgs = args = undefined;
  }
  
  if(typeof args === 'function') {
    fn = args;
    args = undefined;
  }
  
  
  this.createRequest(methodString, ctorArgs, args, fn);
}

// REST ADAPTER IMPL.



RemoteObjects.prototype.buildUrl = function (methodString, args) {
  var base = this.url
  var route = this.contract.routes[methodString];
  var path = route.path;
  var pathParts = path.split('/');
  var finalPathParts = [];
  var argString = args ? ('?args=' + encodeURI(JSON.stringify(args))) : '';
  
  for (var i = 0; i < pathParts.length; i++) {
    var part = pathParts[i];
    var isKey = part[0] === ':';
    var val = isKey && args && args[part.replace(':', '')];
    
    if(!isKey) {
      finalPathParts.push(part);
    } else if(val) {
      finalPathParts.push(val);
    }
  }

  // build url
  return base + finalPathParts.join('/') + argString;
}

RemoteObjects.prototype.createRequest = function (methodString, ctorArgs, args, fn) {
  var self = this;
  var route = this.contract.routes[methodString];
  
  $.ajax({
    type: route.verb,
    url: this.buildUrl(methodString, args),
    body: ctorArgs,
    success: function (data) {
      fn(null, data);
    },
    error: function (data) {
      fn(data);
    }
  });
}

// END REST ADAPTER IMPL.

RemoteObjects.connect = function (url, contract) {
  return new RemoteObjects(url, contract);
}

function RemoteObject(args, remotes) {
  // remove name
  this.name = args.shift();
  
  // save args
  this.ctorArgs = args;
  
  // all remote objects
  this.remotes = remotes;
}

RemoteObject.prototype.invoke = function (method, args, fn) {
  if(typeof args === 'function') {
    fn = args;
    args = undefined;
  }
  
  this.remotes.invoke(this.name + '.prototype.' + method, this.ctorArgs, args, fn);
}