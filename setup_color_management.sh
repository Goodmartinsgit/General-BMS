#!/bin/bash

# Product Color & Image Management Setup Script
# This script sets up the database tables for color and image management

echo "=========================================="
echo "Product Color & Image Management Setup"
echo "=========================================="
echo ""

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "Error: backend/.env file not found!"
    echo "Please create the .env file with database credentials."
    exit 1
fi

# Load environment variables
source backend/.env

echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo ""

# Confirm before proceeding
read -p "Do you want to run the migration? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled."
    exit 0
fi

echo ""
echo "Running migration..."
echo ""

# Run the migration
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f backend/database/migrations/add_product_colors_and_images.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "Migration completed successfully!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Restart your backend server"
    echo "2. Clear frontend cache (npm run build)"
    echo "3. Test the new features in the product edit modal"
    echo ""
else
    echo ""
    echo "=========================================="
    echo "Migration failed!"
    echo "=========================================="
    echo ""
    echo "Please check the error messages above."
    echo "Common issues:"
    echo "- Database connection failed"
    echo "- Tables already exist (safe to ignore)"
    echo "- Permission denied"
    echo ""
    exit 1
fi
