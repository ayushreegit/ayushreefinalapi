const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const fs = require('fs');

// Initialize Express app and other required configurations
const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://demo_user:Maaaa86@@cluster0.lotag7j.mongodb.net/?retryWrites=true', {

  
dbName:"Ayshree",
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(error => console.log('MongoDB connection error:', error));

// Create User schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  usertype:{
    type:String,
    enum:["Agent","Client"],
    default:"Client"
  },
  files: [
    {
      filename: String,
      cloudinaryId: String,
      url: String
    }
  ]
});

const User = mongoose.model('User', userSchema);

// Configure Multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const upload = multer({ dest: 'uploads/' });

// Configure Cloudinary
cloudinary.config({ 
  cloud_name: 'dobcsf72y', 
  api_key: '489658586897445', 
  api_secret: 'bivuZUbd6owLJyXI3wP4J6CZjKs' 
});
// User Registration API
app.post('/register', async (req, res) => {
  const { name, email, password ,usertype} = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create a new user
    const user = new User({ name, email, password ,usertype});
    await user.save();

    res.status(201).json({ message: `${user.name} Registerd successfully`,user});
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// User Login API
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user based on the email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the password matches
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Set user session or generate JWT token for authentication

    res.status(200).json({ message: `${user.name} logged in successfully`,success:true,user });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// User Logout API
app.post('/logout', async (req, res) => {
  // Clear user session or invalidate JWT token

  res.status(200).json({ message: 'User logged out successfully' });
});

// File Upload API
app.post('/upload/:userId', upload.any(), async (req, res) => {
  const { userId } = req.params;

  try {
    // Upload files to Cloudinary
    const uploadPromises = req.files.map(file => cloudinary.uploader.upload(file.path));
    const results = await Promise.all(uploadPromises);

    // Save the uploaded files information to the user's files array in the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const uploadedFiles = results.map(result => ({
      filename: result.original_filename,
      cloudinaryId: result.public_id,
      url: result.secure_url
    }));

    user.files.push(...uploadedFiles);

    await user.save();

    // Remove the uploaded files
    req.files.forEach(file => fs.unlinkSync(file.path));

    res.status(201).json({
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

  

app.get("/users",async(req,res)=>{
    const users =await User.find({});
    res.status(200).json({
        success:true,
        users
    })

})

app.get("/user/:id",async(req,res)=>{
    const user =await User.findById(req.params.id);
    res.status(200).json({
        success:true,
        user
    })

})

// Start the server
app.listen(4000, () => {
  console.log('Server is running on port 4000');
});
