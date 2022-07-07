let chai = require('chai');
let chaiHttp = require('chai-http');
const app = require('../index')
let fs = require('fs');

let should = chai.should();

chai.use(chaiHttp);


describe('Process Image', () => {
    it('Should Resize image', (done) => {
        chai.request('http://localhost:12345')
            .post('/processImage/resizeImages')
            .field('Content-Type', 'multipart/form-data')
            .field('resize_type', 'percentage')
            .field('resize_percent', '25')
            .attach('files','/Users/aniruddhasingha/Development/image_process_service/uploads/tempMedia/28b69a43-a771-47bb-a431-b9789c398a1c.jpeg')
            .end((err, res) => {
                if (err) {
                    console.log(err)
                } else {

                    res.should.have.status(200);
                }
                done();
            })
    })
})