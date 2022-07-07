const express = require('express');
const router = express.Router();
const processImageUrl = require('../controllers/processImageUrls');
router.post('/processUrlFiles',processImageUrl.processUrlFiles);

/**
* @swagger
* components:
*  schemas:
*    processUrlFiles:
*      required:
*      - process_type
*      - urls
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
*        urls:
*          type: array
*          example: ["url_1","url_2"]
*          description: Array of unique ids which is mongoose id of images in repo
*/


/**
* @swagger
* /processImage/processUrlFiles:
*  post:
*    tags:
*    - Process-From-Image-Url
*    summary: This method is used for processing images form image urls .
*    description: ""
*    operationId: processUrlFiles
*    requestBody:
*      content:
*        application/json:
*          schema:
*            $ref: '#/components/schemas/processUrlFiles'
*      required: true
*    responses:
*      200:
*        description: successful response
*      405:
*        description: Invalid input
*/
module.exports = router;