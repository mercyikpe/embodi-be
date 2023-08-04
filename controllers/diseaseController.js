const Disease = require('../models/Disease');



 
// Create a new disease
const createDiseases = async (req, res) => {
  try {
    const { title, category, photo,  detailTitle, detail } = req.body;
    //const userId = req.user.id; // Assuming the user ID is available in req.user.id

    // Create the disease object with user ID
    const diseaseData = {
      title,
      category,
      photo,
      detailTitle,
      detail,
      ////// when loggin, picke user id on the active session///// change this when pushig to git
      /*user: userId,*/ // Assign the user ID to the 'user' field
    };

    const disease = new Disease(diseaseData);
    await disease.save();

    return res.status(201).json({
      status: 'success',
      message: 'Disease created successfully.',
      data: disease,
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.user === 1) {
      return res.status(400).json({
        status: 'failed',
        message: 'Disease with the same user already exists.',
      });
    }
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while creating the disease.',
    });
  }
};


// Get all diseases 

const getDiseases = async (req, res) => {
  try {
    const diseases = await Disease.find();
    return res.status(200).json({
      status: 'success',
      message: 'Diseases fetched successfully.',
      data: diseases,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while fetching diseases.',
    });
  }
};

// controllers/diseaseController.js

// Function to find diseases with at least 100 views per week
const getPopularDiseases = async (req, res) => {
  try {
    const ONE_WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
    const cutoffDate = new Date(Date.now() - ONE_WEEK_IN_MS); // Calculate the date one week ago

    const popularDiseases = await Disease.find({ views: { $gte: 100 }, createdAt: { $gte: cutoffDate } });
    const totalViews = popularDiseases.reduce((acc, disease) => acc + disease.views, 0);

    return res.status(200).json({
      status: 'success',
      message: 'Popular diseases fetched successfully.',
      totalViews: totalViews,
      popularDiseases: popularDiseases,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while fetching popular diseases.',
    });
  }
};

// Function to find the disease with the highest engagement
const getDiseaseWithHighestEngagement = async (req, res) => {
  try {
    const highestEngagementDisease = await Disease.findOne().sort('-engagement');

    return res.status(200).json({
      status: 'success',
      message: 'Disease with highest engagement fetched successfully.',
      highestEngagement: highestEngagementDisease ? highestEngagementDisease.engagement : 0,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while fetching disease with highest engagement.',
    });
  }
};


module.exports = {
  createDiseases,
  getDiseases,
  getPopularDiseases,
  getDiseaseWithHighestEngagement
    
};
