const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({

    username:{
        type:String,
        required:true,
        unique:true 
    },

    password:{
        type:String,
        required:true
    },

    // When true, students cannot login until admin enables them again.
    userLoginLocked:{
        type:Boolean,
        default:false
    }

});

module.exports = mongoose.model("Admin", adminSchema);