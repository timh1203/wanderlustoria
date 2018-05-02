const express = require("express");
const router  = express.Router();
const passport = require("passport");
const middleware = require("../middleware");
const expressSanitizer = require("express-sanitizer");

const User = require("../models/userModel");
const City = require("../models/cityModel");
const Story = require("../models/storyModel");

// CLOUDINARY AND MULTER SETUP
const dotenv = require('dotenv').config();
const multer = require('multer');
const cloudinary = require('cloudinary');
let storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
let imageFilter = function (req, file, cb) {
    if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
let upload = multer({ storage: storage, fileFilter: imageFilter})
cloudinary.config({ 
  cloud_name: 'wanderlustoria', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// NEW ROUTE
router.get("/register", function(req, res){
    res.render("usersNew");
});

// CREATE ROUTE
router.post("/register", upload.single('image'), function(req, res){
    cloudinary.v2.uploader.upload(req.file.path, function(err,result){
        let newUser = new User({
            firstName: req.sanitize(req.body.firstName),
            lastName: req.sanitize(req.body.lastName),
            email: req.sanitize(req.body.email),
            username: req.sanitize(req.body.username),
            image: {
                name: result.secure_url,
                id: result.public_id,
            },
        });

        if(err){
            req.flash("err", err.message);
            return res.redirect("back");
        }
        User.register(newUser, req.body.password, function(err, user){
            if(err){
                req.flash("error", err.message);
                return res.redirect("/register");
            }
            passport.authenticate("local")(req, req, function(){
                req.flash("success", "Welcome to Wanderlustoria, " + user.username + "!")
                res.redirect("/cities");
            })
        })
    })
});

// SHOW ROUTE
router.get("/users/:userId", middleware.isLoggedIn, function(req, res){
    User.findById(req.params.userId, function(err, foundUser){
        if(err){
            req.flash("error", err.message);
            return res.redirect("/cities");
        }
        Story.find().where('author.id').equals(foundUser._id).exec(function(err, foundStories){
            if(err){
                req.flash("error", err.message);
                return res.redirect("/cities");
            }
            else{
                res.render("usersShow", {user: foundUser, stories: foundStories});
            }
        })
    })
});

// EDIT ROUTE
router.get("/users/:userId/edit", middleware.checkProfileOwner, function(req, res){
    User.findById(req.params.userId, function(err, foundUser){
        if(err){
            req.flash("error", err.message);
            return res.redirect("/cities");
        } else {
            res.render("usersEdit", {user: foundUser});
        }
    })
});

// UPDATE ROUTE
router.put("/users/:userId", middleware.checkProfileOwner, upload.single('image'), function(req, res){
    User.findById(req.params.userId, async function(err, foundUser){
        if(req.file){
            try{
                await cloudinary.v2.uploader.destroy(foundUser.image.id);
                let result = await cloudinary.v2.uploader.upload(req.file.path);
                foundUser.image.name = result.secure_url;
                foundUser.image.id = result.profile_id;
            }
            catch(err){
                req.flash("error", err.message);
                return res.redirect("back");
            }
        }
        foundUser.firstName = req.sanitize(req.body.firstName);
        foundUser.lastName = req.sanitize(req.body.lastName);
        foundUser.email = req.sanitize(req.body.email);
        foundUser.body = req.sanitize(req.body.body);
        foundUser.save();
        req.flash("success", "User updated");
        res.redirect("/users/" + req.params.userId);
    })
});

// DESTROY ROUTE
router.delete("/users/:userId", middleware.checkProfileOwner, function(req, res){
    User.findById(req.params.userId, async function(err, foundUser){
        try{
            await cloudinary.v2.uploader.destroy(foundUser.image.id);
            foundUser.remove();
            req.flash("success", "User deleted");
            res.redirect("/cities");
        }
        catch(err){
            req.flash("error", err.message);
            return res.redirect("back");
        }
    })
});

module.exports = router;