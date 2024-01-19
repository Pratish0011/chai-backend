import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      
      cb(null, file.originalname)
      // Better to use other name cuz user can have same name for different files
    }
  })
  
export const upload = multer({ 
    storage, 
})