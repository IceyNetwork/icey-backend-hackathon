#!/bin/bash

# Function to check if MongoDB is ready
wait_for_mongodb() {
    echo "Waiting for MongoDB to be ready..."
    while ! docker exec icey-mongo-rs mongosh --eval "db.runCommand({ping:1})" &>/dev/null; do
        sleep 1
    done
    echo "MongoDB is ready!"
}

# Function to initialize the replica set
init_replica_set() {
    echo "Initializing replica set..."
    docker exec icey-mongo-rs mongosh --eval 'rs.initiate({_id: "rs0", members: [{_id: 0, host: "localhost:27017"}]})' || true
    # Give the replica set time to initialize
    sleep 5
}

# Main script
case "$1" in
    start)
        echo "Starting MongoDB and creating collections..."
        docker compose up -d mongo
        wait_for_mongodb
        init_replica_set
        echo "MongoDB is up!"
        ;;
    restart)
        echo "Restarting MongoDB and clearing collections..."
        docker compose restart mongo
        wait_for_mongodb
        init_replica_set
        echo "MongoDB restarted!"
        ;;
    stop)
        echo "Stopping MongoDB..."
        docker compose stop mongo
        echo "MongoDB stopped."
        ;;
    *)
        echo "Usage: $0 {start|restart|stop}"
        echo "Note: 'restart' will clear all collections."
        exit 1
        ;;
esac

exit 0
