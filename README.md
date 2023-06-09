
## Node JS App

[Output Video Link**](https://drive.google.com/file/d/18nQPTcj50KdLfyGBFj4i8KurIylpjZix/view?usp=sharing)

### Purpose
- Auto reply to incoming emails and save them in "Replied label"

### NPM packages used
- googleapis
- dotenv
- express

## How to Run
- clone the repo
- Install dependencies
```
npm install
```
- Generate credentials from Google Developers Console
- Redirect URI
```
https://developers.google.com/oauthplayground
```
- Enable API services -> Activate Gmail API
- For access token
```
https://developers.google.com
```
- Authorise API link
```
https://mail.google.com
```
- In settings, fill Client ID and Clinet secret
- Exchange Authorization Code for Access Token
- After creating .env file, in terminal use
```
node test.js
```

### Features
1. The app check for new emails in a given Gmail ID
2. The app send replies to Emails that have no prior replies
3. The app add a Label to the email 
4. The app repeat this sequence of steps 1-3 in random intervals of 45 to 120 seconds
5. The app make sure that no double replies are sent to any email at any point. Every email that qualifies the criterion should be replied back with one and only one auto reply.

### Improvements to be done
1. The reply email donot have dynamic sender's name.
2. We have to create a label first "Replied", without it the app not work.
