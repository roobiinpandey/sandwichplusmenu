#!/bin/bash
# Start MongoDB with default data directory
mongod --dbpath "$(pwd)/data" --port 27017 --fork --logpath "$(pwd)/mongodb.log"
echo "MongoDB started on port 27017 with data directory $(pwd)/data"
