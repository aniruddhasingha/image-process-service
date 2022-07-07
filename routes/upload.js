const express = require('express');
const fs = require('fs');
const router = express.Router();
const multer = require("multer");
const uploadPath = process.env.TEMP_FILE_UPLOAD_FOLDER;
const uploads = require('../controllers/uploads');
const { v4 } = require('uuid');
const path = require("path");
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const fileName =  v4()+path.extname(file.originalname);
      cb(null, fileName)
    }
  });
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
      if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
        file.extension_type =file.mimetype.split("/").pop();
                cb(null, true);
      } else {
        cb(null, false);
        return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
      }
    }
  });
router.post('/images',upload.array('files'),uploads.uploadImages);
router.post('/imagesFromUrl',uploads.uploadImagesFromUrl)
router.get('/getSingleImage/:_id',uploads.getUploadedImage);
router.post('/getMultipleImage',uploads.getUploadedImages);
router.post('/listAllImagesInRepo',uploads.listAllImagesInRepo);

/**
* @swagger
* components:
*  schemas:
*    uploadImages:
*      required:
*      - files
*      type: object
*      properties:
*        files:
*          type: array
*          items: 
*           type: string
*           format: binary
*/


/**
* @swagger
* /upload/images:
*  post:
*    tags:
*    - Uploads
*    summary: This method is used for uploading images to repository .
*    description: ""
*    operationId: uploadImages
*    requestBody:
*      content:
*        multipart/form-data:
*          schema:
*            $ref: '#/components/schemas/uploadImages'
*      required: true
*    responses:
*      200:
*        description: successful response
*      405:
*        description: Invalid input
*/

/**
* @swagger
* components:
*  schemas:
*    uploadImagesFromUrl:
*      required:
*      - urls
*      type: object
*      properties:
*        urls:
*          type: array
*          example: ["https://t4.ftcdn.net/jpg/02/44/21/17/360_F_244211780_VFoZhDiuxyWpnTalr0DFilyYqNokEoVZ.jpg","https://media.istockphoto.com/photos/beautiful-flowers-background-picture-id520700958?k=20&m=520700958&s=612x612&w=0&h=fTWRwsQ_vxzlzR0MGkLPGzqolbbpbj4x-VOL9FmEz3A="]
*/


/**
* @swagger
* /upload/imagesFromUrl:
*  post:
*    tags:
*    - Uploads
*    summary: This method is used for uploading images from url to repository .
*    description: ""
*    operationId: uploadImagesFromUrl
*    requestBody:
*      content:
*        application/json:
*          schema:
*            $ref: '#/components/schemas/uploadImagesFromUrl'
*      required: true
*    responses:
*      200:
*        description: successful response
*      405:
*        description: Invalid input
*/

/**
* @swagger
* /upload/getSingleImage/{_id}:
*   get:
*     tags:
*       - Uploads
*     summary: This api download the file in repository using unique id.
*     operationId: uploadImagesFromUrl
*     parameters:
*       - in: path
*         name: _id
*         required: true
*         example: ""
*         schema:
*           type: string
*     responses:
*       200:
*        description: successful response
*       405:
*        description: Invalid input
*/

/**
* @swagger
* components:
*  schemas:
*    uploadGetMultipleImage:
*      required:
*      - multiple_id
*      type: object
*      properties:
*        multiple_id:
*          type: array
*          example: ["id_1","id_2"]
*/


/**
* @swagger
* /upload/getMultipleImage:
*  post:
*    tags:
*    - Uploads
*    summary: This api download the multiple images in the repository using array of unique id.
*    description: ""
*    operationId: uploadGetMultipleImage
*    requestBody:
*      content:
*        application/json:
*          schema:
*            $ref: '#/components/schemas/uploadGetMultipleImage'
*      required: true
*    responses:
*      200:
*        description: successful response
*      405:
*        description: Invalid input
*/


/**
* @swagger
* components:
*  schemas:
*    uploadListAllImagesInRepo:
*      required:
*      - page_no
*      - page_size
*      type: object
*      properties:
*        page_no:
*          type: integer
*          format: int64
*          example: 1
*        page_size:
*          type: integer
*          format: int64
*          example: 10
*/


/**
* @swagger
* /upload/listAllImagesInRepo:
*  post:
*    tags:
*    - Uploads
*    summary: This api lists all images in the repository.
*    description: ""
*    operationId: uploadListAllImagesInRepo
*    requestBody:
*      content:
*        application/json:
*          schema:
*            $ref: '#/components/schemas/uploadListAllImagesInRepo'
*      required: true
*    responses:
*      200:
*        description: successful response
*      405:
*        description: Invalid input
*/
module.exports = router;