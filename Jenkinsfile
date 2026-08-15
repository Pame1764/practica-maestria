pipeline {
    agent any
    stages {
        stage('Checkout') {
            steps {
                // Descarga directa del repositorio
                git 'https://github.com/Pame1764/practica-maestria.git' 
            }
        }
        stage('Identificacion'){
            steps {
                sh 'git rev-parse --short HEAD'
                sh 'git status -short'
            }
        }
    }
}