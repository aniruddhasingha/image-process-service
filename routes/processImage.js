const express = require('express');
const fs = require('fs');
const router = express.Router();
const processImage = require('../controllers/processImage');
const multer = require("multer");
const archiveFiles = require('../utils/archiver');
const uploadPath = process.env.TEMP_FILE_UPLOAD_FOLDER;
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const fileName = file.originalname.toLowerCase().split(' ').join('-');
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
router.get('/', processImage.testProcessImage);
router.post('/uploadImage',upload.array('file'),((req,res)=>{
    const arciveFilePath = archiveFiles(req.files);
    res.download(arciveFilePath.zipFilePath,arciveFilePath.zipfilename ,(err)=>{
      if(err){
        new Error(err)
      }
      fs.unlink(arciveFilePath.zipFilePath, function(){
        console.log("File was deleted") // Callback
    });
    });
}));
router.post('/resizeImages',upload.array('file'),processImage.resizeImages);
router.post('/createTumbnailImages',upload.array('file'),processImage.createTumbnailImages);
router.post('/compressImages',upload.array('file'),processImage.compressImages);
router.post('/rotateImages',upload.array('file'),processImage.rotateImages);
router.post('/maskImages',upload.array('file'),processImage.maskImages);
router.post('/addWatermarkInImages',upload.array('file'),processImage.addWatermarkInImages);
router.post('/changeExtension',upload.array('file'),processImage.changeExtension);
router.post('/processRepoFiles',processImage.processRepoFiles);

/**
* @swagger
* components:
*  schemas:
*    resizeImages:
*      required:
*      - resize_type
*      - file
*      type: object
*      properties:
*        resize_type:
*          type: string
*          enum: ['pixel', 'percentage']
*        resize_percent:
*          type: string
*          enum: ["25", "50", "75"]
*        resize_height:
*          type: string
*          example: "100"
*        resize_width:
*          type: string
*          example: "100"
*        file:
*          type: array
*          items: 
*           type: string
*           format: binary
*/


/**
* @swagger
* /processImage/resizeImages:
*  post:
*    tags:
*    - Process-Image-Directly
*    summary: This method is used for resizing image by percentage and pixel height width .
*    description: ""
*    operationId: resizeImages
*    requestBody:
*      content:
*        multipart/form-data:
*          schema:
*            $ref: '#/components/schemas/resizeImages'
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
*    createTumbnailImages:
*      required:
*      - file
*      type: object
*      properties:
*        file:
*          type: array
*          items: 
*           type: string
*           format: binary
*/


/**
* @swagger
* /processImage/createTumbnailImages:
*  post:
*    tags:
*    - Process-Image-Directly
*    summary: This method is used for creating thubmnail image by default is set to  width - 720 height - 1280 pixels.
*    description: ""
*    operationId: createTumbnailImages
*    requestBody:
*      content:
*        multipart/form-data:
*          schema:
*            $ref: '#/components/schemas/createTumbnailImages'
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
*    compressImages:
*      required:
*      - quality
*      - file
*      type: object
*      properties:
*        quality:
*          type: string
*          example: "30"
*        file:
*          type: array
*          items: 
*           type: string
*           format: binary
*/


/**
* @swagger
* /processImage/compressImages:
*  post:
*    tags:
*    - Process-Image-Directly
*    summary: This method is used for compressing image by quality .
*    description: ""
*    operationId: compressImages
*    requestBody:
*      content:
*        multipart/form-data:
*          schema:
*            $ref: '#/components/schemas/compressImages'
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
*    rotateImages:
*      required:
*      - rotation_type
*      - file
*      type: object
*      properties:
*        rotation_type:
*          type: string
*          enum: ['direction', 'degree']
*        degree:
*          type: string
*          example: "45"
*        rotate:
*          type: string
*          enum: ['left', 'right', 'flip']
*        file:
*          type: array
*          items: 
*           type: string
*           format: binary
*/


/**
* @swagger
* /processImage/rotateImages:
*  post:
*    tags:
*    - Process-Image-Directly
*    summary: This method is used for rotating image by degree and diection.
*    description: ""
*    operationId: rotateImages
*    requestBody:
*      content:
*        multipart/form-data:
*          schema:
*            $ref: '#/components/schemas/rotateImages'
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
*    addWatermarkInImages:
*      required:
*      - water_mark_text
*      - file
*      type: object
*      properties:
*        water_mark_text:
*          type: string
*          example: "DEFAULT TEXT"
*        file:
*          type: array
*          items: 
*           type: string
*           format: binary
*/


/**
* @swagger
* /processImage/addWatermarkInImages:
*  post:
*    tags:
*    - Process-Image-Directly
*    summary: This method adds watermark at the center of the image.
*    description: ""
*    operationId: addWatermarkInImages
*    requestBody:
*      content:
*        multipart/form-data:
*          schema:
*            $ref: '#/components/schemas/addWatermarkInImages'
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
*    maskImages:
*      required:
*      - rgba
*      - file
*      type: object
*      properties:
*        rgba:
*          type: string
*          enum: ['red', 'blue','green']
*        file:
*          type: array
*          items: 
*           type: string
*           format: binary
*/


/**
* @swagger
* /processImage/maskImages:
*  post:
*    tags:
*    - Process-Image-Directly
*    summary: This method is used for masking image with different color channel red or blue or green.
*    description: ""
*    operationId: maskImages
*    requestBody:
*      content:
*        multipart/form-data:
*          schema:
*            $ref: '#/components/schemas/maskImages'
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
*    changeExtension:
*      required:
*      - extension_type
*      - file
*      type: object
*      properties:
*        extension_type:
*          type: string
*          enum: ['jpeg', 'png']
*        file:
*          type: array
*          items: 
*           type: string
*           format: binary
*/


/**
* @swagger
* /processImage/changeExtension:
*  post:
*    tags:
*    - Process-Image-Directly
*    summary: This method is used for changing file mime type.
*    description: ""
*    operationId: changeExtension
*    requestBody:
*      content:
*        multipart/form-data:
*          schema:
*            $ref: '#/components/schemas/changeExtension'
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
*    processRepoFiles:
*      required:
*      - process_type
*      - image_ids
*      type: object
*      properties:
*        process_type:
*          type: string
*          enum: ['resize', 'tumbnail', 'compress', 'rotate', 'masking', 'water_mark', 'change_ext']
*        resize_type:
*          type: string
*          enum: ['pixel', 'percentage']
*          description: If process_type is resize
*        resize_percent:
*          type: string
*          enum: ["25", "50", "75"]
*          description: If process_type is resize and resize_type is percentage
*        resize_height:
*          type: string
*          example: "100"
*          description: If process_type is resize and resize_type is pixel
*        resize_width:
*          type: string
*          example: "100"
*          description: If process_type is resize and resize_type is pixel
*        quality:
*          type: string
*          example: "30"
*          description: If process_type is compress
*        rotation_type:
*          type: string
*          enum: ['direction', 'degree']
*          description: If process_type is rotate
*        degree:
*          type: string
*          example: "45"
*          description: If process_type is rotate and rotation_type is degree
*        rotate:
*          type: string
*          enum: ['left', 'right', 'flip']
*          description: If process_type is rotate and rotation_type is direction
*        water_mark_text:
*          type: string
*          example: "DEFAULT TEXT"
*          description: If process_type is water_mark
*        rgba:
*          type: string
*          enum: ['red', 'blue','green']
*          description: If process_type is masking
*        extension_type:
*          type: string
*          enum: ['jpeg', 'png']
*          description: If process_type is change_ext
*        image_ids:
*          type: array
*          example: ["id_1","id_2"]
*          description: Array of unique ids which is mongoose id of images in repo
*/


/**
* @swagger
* /processImage/processRepoFiles:
*  post:
*    tags:
*    - Process-Image-From-Repo-Files
*    summary: This method is used for processing images in repository .
*    description: ""
*    operationId: processRepoFiles
*    requestBody:
*      content:
*        application/json:
*          schema:
*            $ref: '#/components/schemas/processRepoFiles'
*      required: true
*    responses:
*      200:
*        description: successful response
*      405:
*        description: Invalid input
*/
module.exports = router;