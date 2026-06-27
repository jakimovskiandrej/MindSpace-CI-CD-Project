# MindSpace Application
A full-stack digital wellness platform for teenagers, deployed using Kubernetes with Dockerized backend and frontend services.

## Project Overview
This project demonstrates a three-tier architecture with a React frontend, Node.js/Express backend, and Supabase (PostgreSQL) database, all containerized with Docker and orchestrated via Kubernetes. The app enables students to track their mood, screen time, sleep quality, and stress levels through a daily check-in system.

## Features
- **Frontend:** React app served via Nginx
- **Backend:** Node.js + Express REST API
- **Database:** Supabase (PostgreSQL) with persistent storage
- **Orchestration:** Kubernetes (Deployments, Services, StatefulSet, Ingress)
- **CI/CD:** GitHub Actions pipeline to build and push Docker images to Docker Hub
- **Networking:** Ingress controller for routing frontend and backend requests under a single domain

## Technologies
- Kubernetes (minikube for local cluster)
- Docker & Docker Hub
- React + Vite
- Node.js + Express
- Supabase (PostgreSQL)
- GitHub Actions
- NGINX Ingress Controller

## Getting Started

### Prerequisites
- Docker Desktop
- minikube (Kubernetes local cluster)
- kubectl
- GitHub account with Docker Hub secrets set up for CI/CD
