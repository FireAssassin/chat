`Simple chat server and client written in node.js.`

# Features
- Server can be run on any device with node.js installed. Or you can use the prebuilt binaries. They can be found in the releases section.
- Server can be run on a private network or on the internet. (If you want to run it on the internet you need to port forward the port you set in the config.yaml file.)

# Server

Build:
1. Download source code
2. npm install
3. npm run build

Run:
1. npm start

About config.yaml:
- If you dont have a config.yaml run the program once and it will generate one for you.
- Port is the port the server will run on.
- To make server public (removes server password) set private to false
- To remove need for setting access for specific users set anyone-can-join to true
- To change the server-password of the server change the password in the config.yaml file.
- For every user you want to add to the server add a new user with a unique name and password. 
    eg.:
    ```
    allowed-users: 
        - name: "user1"
          password: "password1"

        - name: "user2"
          password: "password2"
    ```

If you want someone to join you need to give them:
- The ip of the server. This can be found by running "ipconfig" in cmd. You may need to be connected to the same network as the server.
- The port of the server.
- The name of the user.
- The password of the user.
- The password of the server. This can be found in the config.yaml file.

# Client

Compile:
1. Download source code
2. npm install

Run:
1. npm start

About config.yaml:
- If you dont have a config.yaml run the program once and it will generate one for you.
- Inside config you can change how you see yourself by changing SelfName and SelfColor.
- SelfColor has to be a hex color code. (ex: #FF0000).
- If you want color to be set by server(randomized) set SelfColor to any text eg. "a".
- Host is the ip of the server you want to connect to. (ex: "localhost", "35.123.174.34").
- server-password is set by the server and is used to prevent random people from joining.
- User is also set by the server and is used to prevent random people from joining.
- date-format is the format of the date in the chat. (ex: "DD/MM/YYYY HH:mm:ss", "HH:mm:ss").
- Change sound to true if you want to hear a sound when someone sends a message.
- Changing property secure to true will make the client use wss instead of ws.