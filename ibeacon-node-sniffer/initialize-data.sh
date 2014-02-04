
echo load products data 
curl -X POST -H "Content-Type:application/json" -d '{"name": "Product A", "inventory": 11, "price" :66.34, "UPC": "127890"}' http://localhost:3000/api/products;
curl -X POST -H "Content-Type:application/json" -d '{"name": "Product B", "inventory": 22, "price" :22.34, "UPC": "127891"}' http://localhost:3000/api/products;
curl -X POST -H "Content-Type:application/json" -d '{"name": "Product C", "inventory": 33, "price" :11.54, "UPC": "127892"}' http://localhost:3000/api/products;
curl -X POST -H "Content-Type:application/json" -d '{"name": "Product D", "inventory": 44, "price" :9.24, "UPC": "123893"}' http://localhost:3000/api/products;

echo load locations data
curl -X POST -H "Content-Type:application/json" -d '{"name": "Loc A","geo": { "lat": 37.796996, "lng": -122.429281 } ,"LOCATIONTYPE": "retail" }' http://localhost:3000/api/locations;
curl -X POST -H "Content-Type:application/json" -d '{"name": "Loc B","geo": { "lat": 37.766996, "lng": -122.409281 } ,"LOCATIONTYPE": "retail" }' http://localhost:3000/api/locations;
curl -X POST -H "Content-Type:application/json" -d '{"name": "Loc C","geo": { "lat": 37.8000, "lng": -122.449281 } ,"LOCATIONTYPE": "retail" }' http://localhost:3000/api/locations;

echo load customer data
curl -X POST -H "Content-Type:application/json" -d '{"name": "Customer A", "zip": "127891"}' http://localhost:3000/api/customers;
curl -X POST -H "Content-Type:application/json" -d '{"name": "Customer B", "zip": "127892"}' http://localhost:3000/api/customers;


#echo car data
#curl -X POST -H "Content-Type:application/json" -d '{"name":"Mustang", "milage": 1122 }' http://localhost:3000/cars;
#curl -X POST -H "Content-Type:application/json" -d '{"name":"VW Bug", "milage": 3333  }' http://localhost:3000/cars;
#curl -X POST -H "Content-Type:application/json" -d '{"name":"Toyota FJ", "milage": 47734  }' http://localhost:3000/cars;

#echo automobile data
#curl -X POST -H "Content-Type:application/json" -d '{"name": "Toyota"}' http://localhost:3000/automobiles;
#curl -X POST -H "Content-Type:application/json" -d '{"name": "Honda" }' http://localhost:3000/automobiles;

#echo load sailboat data
#curl -X POST -H "Content-Type:application/json" -d '{"designer": "Robert H. Perry","builder": "Valiant Yachts","loa": "39’ 11″ (12.16 m.)","lwl": " 34’ 0″ (10.36 m.)","beam": "12’ 4″ (3.76 m.)","draft": "6’ 0″ (1.83 m.)","ballast": "7,700 lbs. (3,493 kg.)","displacement": "22,500 lbs. (10,206 kg.)","sailarea": "772 sq. ft. (71.7 sq. m.)" }' http://localhost:3000/sailboats;
#curl -X POST -H "Content-Type:application/json" -d '{"designer": "Robert H. Perry","builder": "Valiant Yachts","loa": "37′ 0″","lwl": "31′ 7″","beam": "11′ 5″","draft": "5′ 9″","ballast": " 6,600 lbs","displacement": "17,000 lbs","sailarea": "667 sqft" }' http://localhost:3000/sailboats;








