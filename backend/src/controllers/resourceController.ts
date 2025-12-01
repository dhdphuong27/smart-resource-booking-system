import { Request, Response } from 'express';
import Resource from '../models/Resource';

// @desc    Fetch all resources
// @route   GET /api/resources
// @access  Public (or Private, depends on your need)
export const getResources = async (req: Request, res: Response): Promise<void> => {
  try {
    const resources = await Resource.find({});
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a resource
// @route   POST /api/resources
// @access  Private/Admin
export const createResource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type, capacity, location } = req.body;

    const resource = await Resource.create({
      name,
      type,
      capacity,
      location,
    });

    res.status(201).json(resource);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: (error as Error).message });
  }
};