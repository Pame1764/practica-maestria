pipeline {

    agent any

    tools {
        nodejs 'NodeJS-24'
    }

    options {
        timestamps()
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
    }

    environment {
        

        DOCKER_USER           = 'cinthya12'
        LOCAL_BACKEND_IMAGE   = 'proyecto-3-backend'
        LOCAL_FRONTEND_IMAGE  = 'proyecto-3-frontend'
        REMOTE_BACKEND_IMAGE  = 'proyecto-integrador-backend'
        REMOTE_FRONTEND_IMAGE = 'proyecto-integrador-frontend'

        PUBLIC_BACKEND_URL = 'https://proyecto-integrador-backend-production-92c1.up.railway.app'

        RAILWAY_PROJECT_ID          = '6c759af0-9895-4a99-8b00-bf4642281129'
        RAILWAY_ENVIRONMENT_ID      = 'efdd7c0a-1fa7-4d3a-89d0-f7647e948c4c'
        RAILWAY_BACKEND_SERVICE_ID  = '5c52cc15-b575-488a-969e-c35bacee17c0'
        RAILWAY_FRONTEND_SERVICE_ID = '4c049b51-26d5-4b82-bf0b-2534c80c888c'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend - Install') {
            steps {
                dir('backend') {
                    sh 'npm ci'
                }
            }
        }

        stage('Backend - Prisma') {
            steps {
                dir('backend') {
                    sh 'npx prisma generate'
                }
            }
        }

        stage('Backend - Test') {
            steps {
                dir('backend') {
                    sh 'npm test'
                }
            }
        }

        stage('Frontend - Install') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                }
            }
        }

        stage('Frontend - Lint') {
            steps {
                dir('frontend') {
                    sh 'npm run lint'
                }
            }
        }

        stage('Frontend - Build') {
            steps {
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }

        stage('Docker - Validate') {
            steps {
                sh 'docker compose config --quiet'
            }
        }

        stage('Docker - Build') {
            steps {
        sh "VITE_API_URL=${PUBLIC_BACKEND_URL} docker compose build --build-arg VITE_API_URL=${PUBLIC_BACKEND_URL} --no-cache"
    }
        }

        stage('Docker - Verify Images') {
            steps {
                sh '''
                    set -eu

                    echo "Verificando imágenes construidas..."

                    docker image inspect "${LOCAL_BACKEND_IMAGE}:latest" > /dev/null
                    docker image inspect "${LOCAL_FRONTEND_IMAGE}:latest" > /dev/null

                    echo "Imágenes verificadas correctamente."
                '''
            }
        }

        stage('Docker - Publish') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'Practica-3',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    sh '''
                        set -eu

                        echo "========================================"
                        echo "PUBLICACIÓN EN DOCKER HUB"
                        echo "========================================"

                        export DOCKER_CONFIG="$(mktemp -d)"
                        trap 'rm -rf "$DOCKER_CONFIG"' EXIT

                        echo "$DOCKER_PASS" | docker login                             -u "$DOCKER_USER"                             --password-stdin

                        BACKEND_LATEST="${DOCKER_USER}/${REMOTE_BACKEND_IMAGE}:latest"
                        BACKEND_BUILD="${DOCKER_USER}/${REMOTE_BACKEND_IMAGE}:${BUILD_NUMBER}"

                        FRONTEND_LATEST="${DOCKER_USER}/${REMOTE_FRONTEND_IMAGE}:latest"
                        FRONTEND_BUILD="${DOCKER_USER}/${REMOTE_FRONTEND_IMAGE}:${BUILD_NUMBER}"

                        docker tag "${LOCAL_BACKEND_IMAGE}:latest" "$BACKEND_LATEST"
                        docker tag "${LOCAL_BACKEND_IMAGE}:latest" "$BACKEND_BUILD"

                        docker tag "${LOCAL_FRONTEND_IMAGE}:latest" "$FRONTEND_LATEST"
                        docker tag "${LOCAL_FRONTEND_IMAGE}:latest" "$FRONTEND_BUILD"

                        docker push "$BACKEND_LATEST"
                        docker push "$BACKEND_BUILD"

                        docker push "$FRONTEND_LATEST"
                        docker push "$FRONTEND_BUILD"

                        docker logout

                        echo "Imágenes publicadas correctamente en Docker Hub."
                    '''
                }
            }
        }

        stage('Railway - CLI Check') {
            steps {
                sh '''
                    set -eu
                    echo "Verificando Railway CLI..."
                    npx -y @railway/cli --version
                '''
            }
        }

        stage('Railway - Redeploy Backend') {
            steps {
                withCredentials([
                    string(
                        credentialsId: 'railway-token',
                        variable: 'RAILWAY-TOKEN'
                    )
                ]) {
                    sh '''
                        set -eu

                        echo "========================================"
                        echo "REDEPLOY BACKEND EN RAILWAY"
                        echo "========================================"

                        npx -y @railway/cli redeploy                             --service "$RAILWAY_BACKEND_SERVICE_ID"                             --environment "$RAILWAY_ENVIRONMENT_ID"                             --yes

                        echo "Redeploy del backend solicitado correctamente."
                    '''
                }
            }
        }

        stage('Railway - Redeploy Frontend') {
            steps {
                withCredentials([
                    string(
                        credentialsId: 'railway-token',
                        variable: 'RAILWAY_TOKEN'
                    )
                ]) {
                    sh '''
                        set -eu

                        echo "========================================"
                        echo "REDEPLOY FRONTEND EN RAILWAY"
                        echo "========================================"

                        npx -y @railway/cli redeploy                             --service "$RAILWAY_FRONTEND_SERVICE_ID"                             --environment "$RAILWAY_ENVIRONMENT_ID"                             --yes

                        echo "Redeploy del frontend solicitado correctamente."
                    '''
                }
            }
        }
    }

    post {
        success {
            echo '========================================'
            echo 'PIPELINE SATISFACTORIO'
            echo '========================================'
            echo 'Backend probado correctamente'
            echo 'Frontend validado y construido'
            echo 'Imágenes Docker construidas'
            echo 'Imágenes publicadas en Docker Hub'
            echo 'Redeploy solicitado para Backend en Railway'
            echo 'Redeploy solicitado para Frontend en Railway'
        }

        failure {
            echo '========================================'
            echo 'PIPELINE FALLIDO'
            echo '========================================'
            echo 'Revisar la primera etapa fallida y su Console Output.'
        }

        always {
            sh 'docker logout >/dev/null 2>&1 || true'
        }
    }
}
