// middleware/populateFields.js

const DoctorInfo = require('../models/DoctorInfo');
const User = require('../models/User');

const populateDoctorFields = async (req, res, next) => {
  const { doctorId } = req.params;

  try {
    const doctor = await DoctorInfo.findById(doctorId).populate('user');
    if (!doctor) {
      return res.status(404).json({ message: `Doctor with ID ${doctorId} not found.` });
    }

    req.doctor = {
      id: doctor._id,
      userIdOfDoctor: doctor.user._id,
      firstName: doctor.user.firstName,
      lastName: doctor.user.lastName,
      gender: doctor.user.gender,
      role: doctor.user.role,
      status: doctor.user.status,
      specialty: doctor.specialty,
      rate: doctor.rate,
      // ... add more fields as needed
    };

    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred while populating doctor fields.' });
  }
};

const populatePatientFields = async (req, res, next) => {
  const { patientId } = req.params;

  try {
    const patient = await User.findById(patientId).select('firstName lastName dob phoneNumber email status allergies role');
    if (!patient) {
      return res.status(404).json({ message: `Patient with ID ${patientId} not found.` });
    }

    req.patient = {
      id: patient._id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      dob: patient.dob,
      phone: patient.phoneNumber,
      email: patient.email,
      allergies: patient.allergies,
      role: patient.role,

      // ... add more fields as needed
    };

    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred while populating patient fields.' });
  }
};







const populateDoctor = async (req, res, next) => {
  const { doctorId } = req.params;

  const doctorInfo = await populateDoctorInfo(doctorId);

  if (!doctorInfo) {
    return res.status(404).json({ message: `Doctor with ID ${doctorId} not found.` });
  }

  req.doctor = doctorInfo;

  next();
};

const populatePatient = async (req, res, next) => {
  const { patientId } = req.params;

  const patientInfo = await populatePatientInfo(patientId);

  if (!patientInfo) {
    return res.status(404).json({ message: `Patient with ID ${patientId} not found.` });
  }

  req.patient = patientInfo;

  next();
};


module.exports = { populateDoctorFields, populatePatientFields, populatePatient, populateDoctor };