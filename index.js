const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const morgan = require('morgan');
const mongoose = require('mongoose')
const bodyParser = require('body-parser');
const cors = require('cors');
const swaggerUI = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
//-----swagger setup------
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Docs For Image Process Service',
            version: '1.0.0',
            description: 'API Information',
            contact: {
                name: 'Dev@ Aniruddha Singha'
            }
        },
	servers: [{
        url: 'http://localhost:12345/',
        description: 'Development server'
    }]
    },
    apis: ['./routes/*.js']
};
const specs = swaggerJsDoc(swaggerOptions)
const port = process.env.PORT || 3000
const processImageRoutes = require('./routes/processImage');
const uploadRoutes = require('./routes/upload');
const processUrlRoutes = require('./routes/processImageUrls');
// create upload foldersit does not exist
const fs = require('fs');
const dir = './uploads/tempMedia/processed';

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
};

mongoose.connect(`mongodb://127.0.0.1:27017/${process.env.DB_NAME}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/api-docs",swaggerUI.serve,swaggerUI.setup(specs))
app.use('/processImage', processImageRoutes);
app.use('/upload', uploadRoutes);
app.use('/processImageUrl', processUrlRoutes);
app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
})
app.use((error, req, res, next) => {
    console.log(error.message)
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    });
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
    console.log(`Connected to database ${process.env.DB_NAME} successfully`);
});
app.listen(port, () => {
    console.log(`server listening at ${port}`)
});
module.exports = app;