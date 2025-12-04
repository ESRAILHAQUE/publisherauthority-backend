import mongoose from "mongoose";
import dotenv from "dotenv";
import { Category } from "../modules/blog/blog.model";
import config from "../config/env";

dotenv.config();

const categories = [
  {
    name: "SEO",
    slug: "seo",
    description: "Search Engine Optimization tips and strategies",
  },
  {
    name: "Digital Marketing",
    slug: "digital-marketing",
    description: "Digital marketing trends and insights",
  },
  {
    name: "Content Marketing",
    slug: "content-marketing",
    description: "Content creation and marketing strategies",
  },
  {
    name: "Social Media",
    slug: "social-media",
    description: "Social media marketing and management",
  },
  {
    name: "Web Design",
    slug: "web-design",
    description: "Web design trends and best practices",
  },
];

async function seedCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing categories (optional - remove if you want to keep existing)
    // await Category.deleteMany({});
    // console.log('Cleared existing categories');

    // Insert categories
    for (const categoryData of categories) {
      const existing = await Category.findOne({ slug: categoryData.slug });
      if (!existing) {
        await Category.create(categoryData);
        console.log(`Created category: ${categoryData.name}`);
      } else {
        console.log(`Category already exists: ${categoryData.name}`);
      }
    }

    console.log("Categories seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding categories:", error);
    process.exit(1);
  }
}

seedCategories();
