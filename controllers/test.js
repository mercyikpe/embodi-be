const moment = require('moment');
const Appointment = require('../models/Appointment');
const DoctorInfo  = require('../models/DoctorInfo');
const User = require('../models/User');
const transporter = require('../utilities/transporter');

const createAppointment = async (doctorId, date, appointments) => {
    try {
      const doctorInfo = await DoctorInfo.findById(doctorId).populate('user');
  
      if (!doctorInfo) {
        return { error: 'Doctor not found' };
      }
  
      const startTimeFormatted = appointments[0].startTime;
      const endTimeFormatted = appointments[0].endTime;
  
      // Check if the new appointment conflicts with existing appointments
      const existingAppointments = await Appointment.find({
        doctor: doctorId,
        date,
        'appointments.startTime': { $lt: endTimeFormatted },
        'appointments.endTime': { $gt: startTimeFormatted },
      });
  
      if (existingAppointments.length > 0) {
        const errors = [];
        for (const appointment of existingAppointments) {
          const startTimeOverlaps = appointment.startTime < endTimeFormatted && appointment.startTime >= startTimeFormatted;
          const endTimeOverlaps = appointment.endTime > startTimeFormatted && appointment.endTime <= endTimeFormatted;
  
          if (startTimeOverlaps || endTimeOverlaps) {
            errors.push({
              type: 'overlapping',
              message: 'The requested time slot overlaps with another appointment.',
            });
          }
        }
  
        return {
          error: 'The requested time slot is not available.',
          details: errors,
        };
      }
  
      const appointment = await Appointment.findOneAndUpdate(
        {
          doctor: doctorId,
          date,
          $and: [
            {
              'appointments.startTime': { $ne: startTimeFormatted },
            },
            {
              'appointments.endTime': { $ne: endTimeFormatted },
            },
          ],
        },
        {
          $push: { appointments: appointments[0] },
        },
        { new: true }
      );
  
      if (!appointment) {
        const newAppointmentData = {
          date,
          doctor: doctorInfo.user,
          appointments,
        };
  
        const newAppointment = new Appointment(newAppointmentData);
        await newAppointment.save();
  
        // Add the new appointment to the doctor's available time slots
        const updatedAvailableTimeSlots = doctorInfo.availableTimeSlots.concat({
          date,
          startTime: startTimeFormatted,
          endTime: endTimeFormatted,
        });
  
        // Update the doctor's availableTimeSlots field
        doctorInfo.availableTimeSlots = updatedAvailableTimeSlots;
        await doctorInfo.save();
  
        // Get the doctor's email address from the User model
        const email = doctorInfo.user.email;
  
        // Send email to doctor to confirm appointment creation
        const doctorMailOptions = {
          from: process.env.AUTH_EMAIL,
          to: email,
          subject: 'Appointment Created',
          html: `
            <h1>Appointment Created</h1>
            <p>An appointment has been created for you on ${date} from ${startTimeFormatted} to ${endTimeFormatted}.</p>
            <p>You will be seeing Dr. ${doctorInfo.user.firstName} ${doctorInfo.user.lastName}.</p>
          `,
        };
  
        transporter.sendMail(doctorMailOptions, (error, info) => {
          if (error) {
            console.log(error);
          } else {
            console.log('Doctor email sent: ' + info.response);
          }
        });
  
        return { success: true, appointment: newAppointment };
      }
  
      return { success: true, appointment };
    } catch (error) {
      console.error('Error:', error);
      return { error: 'An error occurred while processing the appointment request.' };
    }
  };



  const createAppointment2 = async (doctorId, date, appointments) => {
    try {
      const doctorInfo = await DoctorInfo.findOne({ user: doctorId });
  
      if (!doctorInfo) {
        return { error: 'Doctor not found' };
      }
  
      const startTimeFormatted = appointments[0].startTime;
      const endTimeFormatted = appointments[0].endTime;
  
      // Check if the new appointment conflicts with existing appointments
      const existingAppointments = await Appointment.find({
        doctor: doctorId,
        date,
        'appointments.startTime': { $lt: endTimeFormatted },
        'appointments.endTime': { $gt: startTimeFormatted },
      });
  
      if (existingAppointments.length > 0) {
        return {
          success: false,
          message: 'The requested time slot conflicts with existing appointments.',
        };
      }
  
      const appointment = await Appointment.findOneAndUpdate(
        {
          doctor: doctorId,
          date,
          $and: [
            {
              'appointments.startTime': { $ne: startTimeFormatted },
            },
            {
              'appointments.endTime': { $ne: endTimeFormatted },
            },
          ],
        },
        {
          $push: { appointments: appointments[0] },
        },
        { new: true }
      );
  
      if (!appointment) {
        const newAppointmentData = {
          date,
          doctor: doctorInfo.user,
          appointments,
        };
  
        const newAppointment = new Appointment(newAppointmentData);
        await newAppointment.save();
  
    // Get the doctor's email address from the User model
   const doctorEmail = doctorInfo.user.email;
  
        return { success: true, appointment: newAppointment };
      }
  
      return { success: true, appointment };
    } catch (error) {
      console.error('Error:', error);
      return { error: 'An error occurred while processing the appointment request.' };
    }
  };



/////// works well
  const createAppointment3 = async (doctorId, date, appointments) => {
    try {
    const doctorInfo = await DoctorInfo.findOne({ user: doctorId });
    
    if (!doctorInfo) {
      return { error: 'Doctor not found' };
    }
    
    const startTimeFormatted = appointments[0].startTime;
    const endTimeFormatted = appointments[0].endTime;
    
    // Check if the new appointment conflicts with existing appointments
    const existingAppointments = await Appointment.find({
      doctor: doctorId,
      date,
      'appointments.startTime': { $lt: endTimeFormatted },
      'appointments.endTime': { $gt: startTimeFormatted },
    });
    
    if (existingAppointments.length > 0) {
      const errors = [];
      for (const appointment of existingAppointments) {
        const startTimeOverlaps = appointment.startTime < endTimeFormatted && appointment.startTime >= startTimeFormatted;
        const endTimeOverlaps = appointment.endTime > startTimeFormatted && appointment.endTime <= endTimeFormatted;
    
        if (startTimeOverlaps || endTimeOverlaps) {
          errors.push({
            type: 'overlapping',
            message: 'The requested time slot overlaps with another appointment.',
          });
        }
      }
    
      return {
        error: 'The requested time slot is not available.',
        details: errors,
      };
    }
    
    const appointment = await Appointment.findOneAndUpdate(
      {
        doctor: doctorId,
        date,
        $and: [
          {
            'appointments.startTime': { $ne: startTimeFormatted },
          },
          {
            'appointments.endTime': { $ne: endTimeFormatted },
          },
        ],
      },
      {
        $push: { appointments: appointments[0] },
      },
      { new: true }
    );
    
    if (!appointment) {
      const newAppointmentData = {
        date,
        doctor: doctorInfo.user,
        appointments,
      };
    
      const newAppointment = new Appointment(newAppointmentData);
      await newAppointment.save();
    
      // Get the doctor's email address from the User model
      const doctorEmail = doctorInfo.user.email;
    
      return { success: true, appointment: newAppointment };
    }
    
    return { success: true, appointment };
    } catch (error) {
    console.error('Error:', error);
    return { error: 'An error occurred while processing the appointment request.' };
    }
    };

module.exports = {
    
  };


  ///// works well but not sending email
  const createAppointment10 = async (doctorId, date, appointments) => {
    try {
    const doctorInfo = await DoctorInfo.findOne({ user: doctorId});
   
    if (!doctorInfo) {
      return { error: 'Doctor not found' };
    }
    
    const startTimeFormatted = appointments[0].startTime;
    const endTimeFormatted = appointments[0].endTime;
    
    // Check if the new appointment conflicts with existing appointments
    const existingAppointments = await Appointment.find({
      doctor: doctorId,
      date,
      'appointments.startTime': { $lt: endTimeFormatted },
      'appointments.endTime': { $gt: startTimeFormatted },
    });
    
    if (existingAppointments.length > 0) {
      const errors = [];
      for (const appointment of existingAppointments) {
        const startTimeOverlaps = appointment.startTime < endTimeFormatted && appointment.startTime >= startTimeFormatted;
        const endTimeOverlaps = appointment.endTime > startTimeFormatted && appointment.endTime <= endTimeFormatted;
    
        if (startTimeOverlaps || endTimeOverlaps) {
          errors.push({
            type: 'overlapping',
            message: 'The requested time slot overlaps with another appointment.',
          });
        }
      }
    
      return {
        error: 'The requested time slot is not available.',
        details: errors,
      };
    }
    
    const appointment = await Appointment.findOneAndUpdate(
      {
        doctor: doctorId,
        date,
        $and: [
          {
            'appointments.startTime': { $ne: startTimeFormatted },
          },
          {
            'appointments.endTime': { $ne: endTimeFormatted },
          },
        ],
      },
      {
        $push: { appointments: appointments[0] },
      },
      { new: true }
    );
    
    if (!appointment) {
      const newAppointmentData = {
        date,
        doctor: doctorInfo.user,
        appointments,
      };
    
      const newAppointment = new Appointment(newAppointmentData);
      await newAppointment.save();
    
      // Add the new appointment to the doctor's available time slots
      const updatedAvailableTimeSlots = doctorInfo.availableTimeSlots.concat({
        date,
        startTime: startTimeFormatted,
        endTime: endTimeFormatted,
      });
    
      // Update the doctor's availableTimeSlots field
      doctorInfo.availableTimeSlots = updatedAvailableTimeSlots;
      await doctorInfo.save();
    
      // Get the doctor's email address from the User model
      const doctorEmail = doctorInfo.user.email;
  
      
        // Send email to doctor to confirm appointment creation
        const doctorMailOptions = {
          from: process.env.AUTH_EMAIL,
          to: doctorEmail,
          subject: 'Appointment Created',
          html: `
            <h1>Appointment Created</h1>
            <p>An appointment has been created for you on.</p>
          `,
        };
    
        transporter.sendMail(doctorMailOptions, (error, info) => {
          if (error) {
            console.log(error);
          } else {
            console.log('Doctor email sent: ' + info.response);
          }
        });
  
      
    
      return { success: true, appointment: newAppointment };
    }
    
    return { success: true, appointment };
    } catch (error) {
    console.error('Error:', error);
    return { error: 'An error occurred while processing the appointment request.' };
    }
    }


    //// works well but doesnt check for exisitig=ng appointmnt
    const createAppointment22 = async (doctorId, date, appointments) => {
        try {
          const doctorInfo = await DoctorInfo.findById(doctorId).populate('user');
      
          if (!doctorInfo) {
            return { error: 'Doctor not found' };
          }
      
          const startTimeFormatted = appointments[0].startTime;
          const endTimeFormatted = appointments[0].endTime;
      
          // Check if the new appointment conflicts with existing appointments
          const existingAppointments = await Appointment.find({
            doctor: doctorId,
            date,
            'appointments.startTime': { $lt: endTimeFormatted },
            'appointments.endTime': { $gt: startTimeFormatted },
          });
      
          if (existingAppointments.length > 0) {
            const errors = [];
            for (const appointment of existingAppointments) {
              const startTimeOverlaps = appointment.startTime < endTimeFormatted && appointment.startTime >= startTimeFormatted;
              const endTimeOverlaps = appointment.endTime > startTimeFormatted && appointment.endTime <= endTimeFormatted;
      
              if (startTimeOverlaps || endTimeOverlaps) {
                errors.push({
                  type: 'overlapping',
                  message: 'The requested time slot overlaps with another appointment.',
                });
              }
            }
      
            return {
              error: 'The requested time slot is not available.',
              details: errors,
            };
          }
      
          const appointment = await Appointment.findOneAndUpdate(
            {
              doctor: doctorId,
              date,
              $and: [
                {
                  'appointments.startTime': { $ne: startTimeFormatted },
                },
                {
                  'appointments.endTime': { $ne: endTimeFormatted },
                },
              ],
            },
            {
              $push: { appointments: appointments[0] },
            },
            { new: true }
          );
      
          if (!appointment) {
            const newAppointmentData = {
              date,
              doctor: doctorInfo.user,
              appointments,
            };
      
            const newAppointment = new Appointment(newAppointmentData);
            await newAppointment.save();
      
            // Add the new appointment to the doctor's available time slots
            const updatedAvailableTimeSlots = doctorInfo.availableTimeSlots.concat({
              date,
              startTime: startTimeFormatted,
              endTime: endTimeFormatted,
            });
      
            // Update the doctor's availableTimeSlots field
            doctorInfo.availableTimeSlots = updatedAvailableTimeSlots;
            await doctorInfo.save();
      
            // Get the doctor's email address from the User model
            const email = doctorInfo.user.email;
      
            // Send email to doctor to confirm appointment creation
            const doctorMailOptions = {
              from: process.env.AUTH_EMAIL,
              to: email,
              subject: 'Appointment Created',
              html: `
                <h1>Appointment Created</h1>
                <p>An appointment has been created for you on ${date} from ${startTimeFormatted} to ${endTimeFormatted}.</p>
                <p>You will be seeing Dr. ${doctorInfo.user.firstName} ${doctorInfo.user.lastName}.</p>
              `,
            };
      
            transporter.sendMail(doctorMailOptions, (error, info) => {
              if (error) {
                console.log(error);
              } else {
                console.log('Doctor email sent: ' + info.response);
              }
            });
      
            return { success: true, appointment: newAppointment };
          }
      
          return { success: true, appointment };
        } catch (error) {
          console.error('Error:', error);
          return { error: 'An error occurred while processing the appointment request.' };
        }
      };

      /*
const createAppointment = async (doctorId, date, appointments) => {
  try {
    const doctorInfo = await DoctorInfo.findById(doctorId).populate('user');

    if (!doctorInfo) {
      return { error: 'Doctor not found' };
    }

    // Convert provided startTime and endTime to ISO format
    // const startTimeFormatted = appointments[0].startTime;
    // const endTimeFormatted = appointments[0].endTime;
    
      const startTimeFormatted = moment(startTime, 'hh:mm A').toISOString();
     const endTimeFormatted = moment(endTime, 'hh:mm A').toISOString();


    console.log(startTimeFormatted)
    console.log(endTimeFormatted)

    // Check if the new appointment conflicts with existing appointments
    const existingAppointments = await Appointment.find({
      doctor: doctorId,
      date,
      $or: [
        {
          'appointments.startTime': startTimeFormatted,
          'appointments.endTime': endTimeFormatted,
        },
        {
          'appointments.startTime': { $lt: endTimeFormatted },
          'appointments.endTime': { $gt: startTimeFormatted },
        },
      ],
    });


    // Check if startTimeFormatted is greater than or equal to endTimeFormatted
if (startTimeFormatted >= endTimeFormatted) {
  return res.status(400).json({
    status: 'failed',
    message: 'Start time must be earlier than end time.',
  });
}

    if (startTimeFormatted === endTimeFormatted) {
      return {
        error: 'Start time and end time cannot be the same.',
      };
    }

    if (existingAppointments.length > 0) {
      const errors = [];
      for (const appointment of existingAppointments) {
        const startTimeOverlaps = appointment.startTime < endTimeFormatted && appointment.startTime >= startTimeFormatted;
        const endTimeOverlaps = appointment.endTime > startTimeFormatted && appointment.endTime <= endTimeFormatted;

        if (startTimeOverlaps || endTimeOverlaps) {
          errors.push({
            type: 'overlapping',
            message: 'The requested time slot overlaps with another appointment.',
          });
        }
      }

      if (errors.length > 0) {
        return {
          error: 'The requested time slot is not available.',
          details: errors,
        };
      } else {
        return {
          error: 'An appointment with the same start and end time already exists on the specified date.',
        };
      }
    }

    const appointment = await Appointment.findOneAndUpdate(
      {
        doctor: doctorId,
        date,
        $and: [
          {
            'appointments.startTime': { $ne: startTimeFormatted },
          },
          {
            'appointments.endTime': { $ne: endTimeFormatted },
          },
        ],
      },
      {
        $push: { appointments: appointments[0] },
      },
      { new: true }
    );

    if (!appointment) {
      const newAppointmentData = {
        date,
        doctor: doctorInfo.user,
        appointments,
      };

      const newAppointment = new Appointment(newAppointmentData);
      await newAppointment.save();

      // Add the new appointment to the doctor's available time slots
      const updatedAvailableTimeSlots = doctorInfo.availableTimeSlots.concat({
        date,
        startTime: startTimeFormatted,
        endTime: endTimeFormatted,
      });

      // Update the doctor's availableTimeSlots field
      doctorInfo.availableTimeSlots = updatedAvailableTimeSlots;
      await doctorInfo.save();

      // Get the doctor's email address from the User model
      const email = doctorInfo.user.email;

      // Send email to doctor to confirm appointment creation
      const doctorMailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: 'Appointment Created',
        html: `
          <h1>Appointment Created</h1>
          <p> Hi, ${doctorInfo.user.firstName} ${doctorInfo.user.lastName}, You have successfully sheduled an appointment for  ${date} from ${startTimeFormatted} to ${endTimeFormatted}.</p>
        
        `,
      };

      transporter.sendMail(doctorMailOptions, (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log('Doctor email sent: ' + info.response);
        }
      });

      return { success: true, appointment: newAppointment };
    }

    return { success: true, appointment };
  } catch (error) {
    console.error('Error:', error);
    return { error: 'An error occurred while processing the appointment request.' };
  }
};
      */