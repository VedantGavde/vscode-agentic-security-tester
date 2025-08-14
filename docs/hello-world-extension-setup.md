# Hello World VS Code Extension - Setup

## Purpose
This document records my first step in working towards a larger security-focused VS Code extension project.
The goal here was to scaffold and run a simple "Hello World" extension to understand the VS Code extension development workflow.

---

## System Environment
- **OS**: Ubuntu 24.04 LTS (dual boot with Windows 11)
- **Node.js**: v22.18.0 (LTS)
- **npm**: Installed with Node.js
- **Git**: Latest stable release
- **Visual Studio Code**: Latest stable release

---

## Install Steps

### 1. Node.js (LTS)
```bash
# Download and install Node.js 22.x from NodeSource
sudo apt install curl
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt install -y nodejs

# Download and install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

#Reload shell
source ~/.bashrc

# Verify Node.js and npm versions
node -v
npm -v

# Lock Node.js version for project stability
echo "v$(node -v)" > .nvmrc
```

### 2. Visual Studio Code
```bash
# Import Microsoft GPG key
sudo apt install wget gpg
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
sudo install -o root -g root -m 644 packages.microsoft.gpg /usr/share/keyrings/
rm -f packages.microsoft.gpg

# Enable VS Code repository
sudo sh -c 'echo "deb [arch=amd64 signed-by=/usr/share/keyrings/packages.microsoft.gpg] \
https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list'

# Install VS Code
sudo apt update
sudo apt install -y code

# Verify VS Code installation
code --version
```

### 3. Git
```bash
# Install Git
sudo apt install -y git

# Verify Git installation
git --version

# Configure Git (replace with your own name & email)
git config --global user.name "Your Name"
git config --global user.email "you@example.com"

#Check of it is correct
git config --list
```
