pipeline {
    agent any
    stages {
        stage('Checkout') {
            steps {
                // Descarga directa del repositorio
                git 'https://github.com/tu-usuario/tu-repositorio.git' 
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