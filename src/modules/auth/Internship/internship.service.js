import AppError from "../../../utils/AppError.js";
import Internship from "../../../models/Internship.js";
import Company from "../../../models/Companies.js";

export const createInternship = async (userId, internshipData = {}) => {
  const company = await Company.findOne({ user: userId });

  if (!company) {
    throw new AppError("Company not found", 404);
  }

  return Internship.create({
    company: company._id,
    ...internshipData,
  });
};

export const getAllInternship = async (query = {}) => {
  const filter = {};

  if (query.search) {
    filter.$or = [
      {
        title: {
          $regex: query.search,
          $options: "i",
        },
      },
      {
        description: {
          $regex: query.search,
          $options: "i",
        },
      },
    ];
  }

  if (query.location) {
    filter.location = query.location;
  }

  if (query.type) {
    filter.type = query.type;
  }

  if (query.skill) {
    filter.skills = query.skill;
  }

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;

  const skip = (page - 1) * limit;
  const total = await Internship.countDocuments(filter);

  const internships = await Internship.find(filter)
    .populate({
      path: "company",
      populate: {
        path: "user",
        select: "name email role",
      },
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    total,
    page,
    limit,
    internships,
  };
};

export const getInternshipById = async (id) => {
  const internship = await Internship.findById(id).populate({
    path: "company",
    populate: {
      path: "user",
      select: "name email role",
    },
  });

  if (!internship) {
    throw new AppError("Internship Not Found", 404);
  }

  return internship;
};

export const updateInternship = async (userId, internshipId, updateData) => {
  const company = await Company.findOne({ user: userId });

  if (!company) {
    throw new AppError("Company not Found", 404);
  }
  const internship = await Internship.findById(internshipId);

  if (!internship) {
    throw new AppError("Internship not Found", 404);
  }

  if (!internship.company.equals(company._id)) {
    throw new AppError(
      "You do not have permission to update this internship",
      403,
    );
  }

  const updatedInternship = await Internship.findByIdAndUpdate(
    internshipId,
    updateData,
    {
      new: true,
      runValidators: true,
    },
  ).populate({
    path: "company",
    populate: {
      path: "user",
      select: "name email role",
    },
  });

  return updatedInternship;
};

export const deleteInernshipById = async (userId, internshipId) => {
  const company = await Company.findOne({ user: userId });

  if (!company) {
    throw new AppError("Company not Found", 404);
  }

  const internship = await Internship.findById(internshipId);

  if (!internship) {
    throw new AppError("Internship not found", 404);
  }

  if (!internship.company.equals(company._id)) {
    throw new AppError(
      "You do not have permission to update this internship",
      403,
    );
  }

  await internship.deleteOne();
};
