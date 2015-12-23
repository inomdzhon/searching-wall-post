SearchingWallPost
======
Very powerful, super, incredible application, which will help you find some of the records of your friends from social network Vkontakte.
Yeah, yeah this you haven't seen before!

Doodle, Galaxysoft all don't understand how this's possible. But I did!

Seriously through, I did it for practice and fun. This doesn't work perfectly, but I have enough.

##Installation
If you want to try, then you can take the following actions:

*Requirements*: MySQL, NodeJS, Internet connection, Browser.

*Note*: VK application authorization uses the [OAuth 2.0 open protocol](http://oauth.net/2/).
1. Create profile [http://vk.com/](http://vk.com/)
2. To shaw charisma and make friends.
3. Go to the [http://vk.com/dev/](http://vk.com/dev/)
4. Create a new application (then "client id", "secure key" up your sleeve)
    - Category: Website
5. Go to the settings your application and set next (example for local machine):
   - Site address: http://localhost:3000
   - Base domen: localhost:3000
   - Authorized redirect URI: http://localhost:3000/vklogin.html
6. Not bad for a start!
7. Clone repository and install node modules
```
git clone https://github.com/svarnoi420/searching-wall-post.git
npm install
```
8. Now we play the game. Because I know you like play the games. Go to the directory *lib/app_server.js* and *src/index.html*, then change all **YOURS** on your data.
9. When you're ready start the server:
```
node server
```
10. Perfect! Or all went to hell...

##TODO
To be more powertful:
- don't add records to database, and do all on the client
- optimize
- add filter