# Drone Delivery

- _publisher.py_ - template for publishing
- _subscriber.py_ - template for subscribing
- _drone.py_ - work-in-progress prototype of drone state machine with incorporated MQTT communication
- _messages.proto_ - definition of messages in protobuf; after modifying they need to be re-processed with protoc.exe

### Link to protobuf releases
URL: https://github.com/protocolbuffers/protobuf/releases

After modifying _messages.proto_ need to run:
> .\protoc-25.9-win64\bin\protoc.exe --python_out=. messages.proto