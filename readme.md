# ExpressJS Backend (prisma)

This branch is created to document progress of building an backend app with ExpressJS.

## Progress description:

This branch purpose is to implementing ESLint, Prettier, and morgan as devdependency into the backend.

## NodeJS version

This app run on **CommonJS** version (which mean you can only use 'require' instead of 'import'). If you want to use **ESM** standard syntax on forward development it is recommended to use `babel` npm package from [here](https://www.npmjs.com/package/@babel/core) so your project can use both node.js version.

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file (stored in `.env.example` too):

`BACKEND_RUNNING_PORT=your_running_port`
`PG_USER=your_db_user`
`PG_HOST=your_host`
`PG_DB_NAME=your_db_name`
`PG_PASSWORD=your_db_password`
`PG_PORT=your_db_port`
`SECRET_KEY_JWT=your_jwt_secret_key`
`CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name`
`CLOUDINARY_API_KEY=your_cloudinary_api_key`
`CLOUDINARY_API_SECRET=your_cloudinary_api_secret`
`DATABASE_URL="postgresql://<DB Username>:<DB Password>@localhost:5432/<DB Name>?schema=public"`

## Dependency package list

| Dependency Name |        Command         | Purpose                                                  |
| :-------------- | :--------------------: | :------------------------------------------------------- |
| bcryptjs        |    `npm i bcryptjs`    | Hashing passwords for secure storage.                    |
| cors            |      `npm i cors`      | Enabling Cross-Origin Resource Sharing for API requests. |
| dotenv          |     `npm i dotenv`     | Loading environment variables from a `.env` file.        |
| express         |    `npm i express`     | The core web framework for building the backend API.     |
| helmet          |     `npm i helmet`     | Securing frontend apps by setting various HTTP headers.  |
| http-errors     |  `npm i http-errors`   | Creating HTTP errors for consistent response handling.   |
| jsonwebtoken    |  `npm i jsonwebtoken`  | Implementing token-based authentication (JWT).           |
| pg              |       `npm i pg`       | PostgreSQL client for interacting with the database.     |
| uuid            |      `npm i uuid`      | Generating universally unique identifiers.               |
| cloudinary      |   `npm i cloudinary`   | Connecting to cloudinary cloud.                          |
| zod             |      `npm i zod`       | Data validation.                                         |
| prisma client   | `npm i @prisma/client` | Interacting with prisma.                                 |

## Dev-dependency package list

| Dependency Name |       Command       | Purpose                                                                    |
| :-------------- | :-----------------: | :------------------------------------------------------------------------- |
| Nodemon         | `npm i nodemon -D`  | Start the app automatically after saving                                   |
| morgan          |  `npm i morgan -D`  | Monitoring request and respond                                             |
| @types/node     | `npm i @types/node` | Installing Typescript definition files for the Node.js runtime environment |

## Extension list

| Extension Name |              Purpose              |
| :------------- | :-------------------------------: |
| Prisma         | Add necessities for .prisma files |

## Preparing your environment (by fetching this branch):

1. fetch this branch on your local folder.
2. run `npm install` to install every dependency based of `package.json`.

## Configure the ESlint (by manual install):

1. run `npm init @eslint/config@latest` to install ESlint and its config file
2. Configure ignored file or folder, and rule in `eslint.config.js` based of your need
3. Run `npm run lint` to check the code with ESlint
4. Run `npx eslint --fix` to fix problem automatically (if possible)

## Configure the ESlint (by fetch this branch):

1. run `npm install` to install every dependency and devdependency
2. Configure ignored file or folder, and rule in `eslint.config.js` based of your need
3. Run `npm run lint` to check the code with ESlint
4. Run `npx eslint --fix` to fix problem automatically (if possible)

5. Download an **PostgreSQL** database (if you want to run it locally)
6. Pick or make an database for this project
7. Save the credentials data and write it on your own `.env` (use `.env.example` as a reference)
8. Use the db credentials data to fill `DATABASE_URL` in `.env` to connect it to Prisma
9. **(If using Typescript)** run `npm i -D @types/node` to make it compatible
10. Install required dependency and devdependency by run `npm run prisma-setup`
11. Make the database schema in in `schema.prisma` or pull schema from db by using `npx prisma db pull`
12. After schema is defined, run `npm run schema-update` to save the schema

## Runnable Script

Script that you could use can be found in **script** section in `package.json`.

```json
"scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "server": "node index.js",
    "dev": "nodemon index.js",
    "schema-update":"npx prisma migrate dev && npx prisma generate",
    "prisma-setup":"npm i prisma --save-dev && npx prisma init && npm i @prisma/client",
    "lint": "eslint"
},
```

- run `npm run dev` to start the app with **nodemon** package (it will automatically restart if you save the file).
- run `npm run server` to start the app without **nodemon**.
- (**discouraged**) run directly the main file with `node index.js`.

## API testing

- You can use browser with url `localhost:<port>/` to test avaible routes.
- You can use **Postman** to test your API by .downloading it [here.](https://www.postman.com/downloads/)
