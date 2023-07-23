const mongoose = require('mongoose')
const dotenv = require('dotenv')
const validator = require('validator')
dotenv.config({
    path: './config.env'
})
 


const DB = process.env.DATABASE
    
mongoose.connect(DB, {
    useNewUrlParser: true,
    
    useUnifiedTopology: true
}).then( con=> {
    console.log('DB connection successfull');
}).catch(err=>{
    console.log(err);
})

const userSchemaObject = {
    name: {
        type: String,
        required: [true, 'A user must have a user name'],
        maxLength: 50,
        minLength: 3,
        trim:true
    },
    email:{
        type: String,
        required: [true , 'A user must have an user email'],
        minLength: 5,
        trim: true,
        unique: true,
        lowercase: true,
        validate : [validator.isEmail , 'please provide a valid email']
    },
    peerId: {
        type:String,
        required: [true, 'A user must have an peer id.'],
        unique : true,
        maxLength: 50,
        minLength: 2
    },
    bio: {
        type: String,
        default: "",
        maxLength: 200,
        minLength: 0,
        trim:true
    },
    photo:{
        type:String,
        default: 'default.jpg'
        
    },
    password:{
        type : String , 
        required: [true , 'A user must have an user pwd'],
        minLength: 8,
        select: false 
    },
    passwordConfirm :{
        type : String , 
        required: [true , 'A user must have an user pwd'],
        minLength: 8,
        validate:{
            //this only work on save / create
            validator: function(el){
                return el === this.password
            },
            message: "pwd are not same"
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExipres: Date,
    active:{
        type: Boolean,
        
    },
    busy:{
        type: Boolean,
        default: false
    },
    status:{
        type: Boolean,
        select: false,
        default: true
    },
    recentContact: [{
        type : mongoose.Schema.ObjectId,
        ref: 'User',
        
    }],
    interests:[{
        type: String
    }],
    recommendedPeers: [{
        type : mongoose.Schema.ObjectId,
        ref: 'User',
        
    }]
}

const userSchema = new mongoose.Schema(userSchemaObject)
const User  = mongoose.model('User', userSchema)
async function load(){
    const user_arr  = await User.find().select('_id interests')
    console.log(user_arr)
    return user_arr;
}
let interestsHash = {}
load().then( arr => {
    arr.forEach( elm => {
        elm.interests.forEach( i => {
            if(interestsHash[i] === undefined){
                interestsHash[i] = []
                
            }
            interestsHash[i].push(elm._id)
        })
    })
    console.log( interestsHash)
    console.log( 'Started Uploading at'+ Date.now())
    updateRecommList( arr)
    console.log('update done at ' + Date.now())
})
function createList(user){
    let list = []
        user.interests.forEach( i => {
            console.log(i, "::",interestsHash[i])
            interestsHash[i].forEach( _id => {
                list.push(_id);
            })
            
        })
        console.log("print: ",list)
    return list
}
function updateRecommList(arr){
    arr.forEach( async elm=> {
        let list = createList(elm)
        await User.findByIdAndUpdate(elm._id, {
            $addToSet:{
                recommendedPeers:{
                    $each:  list
                }
            }
        })
    })
}




