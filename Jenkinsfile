pipeline {
    agent any

    

    options {
        timestamps()
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
    }

    tools {
        nodejs 'NodeJS 20'
    }

    triggers {
        githubPush()
    }

    environment {
        DOCKER_HOST                 = 'unix:///var/run/docker.sock'

        LOCAL_BACKEND_IMAGE         = 'sistemaweb-backend'
        LOCAL_FRONTEND_IMAGE        = 'sistemaweb-frontend'
        
        REMOTE_BACKEND_IMAGE        = 'proyecto-integrador-backend'
        REMOTE_FRONTEND_IMAGE       = 'proyecto-integrador-frontend'
        
        RAILWAY_PROJECT_ID          = '37075425-4eaf-4f1a-a5f7-e49455ea4173'
        RAILWAY_ENVIRONMENT_ID      = '639055fb-12c3-4077-91c3-20d8ca004ac9'
        RAILWAY_BACKEND_SERVICE_ID  = '92fe0ca7-47b4-4cda-9f07-f791e68c7d55'
        RAILWAY_FRONTEND_SERVICE_ID = '2a6e2269-b339-4078-aa38-5300ce07491c'
    }

    stages {
        stage('Checkout & Metadata') {
            steps {
                script {
                    def scmVars = checkout scm
                    env.SCM_GIT_BRANCH = scmVars.GIT_BRANCH ?: ''
                    env.GIT_FULL       = scmVars.GIT_COMMIT ?: sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
                    env.GIT_SHORT      = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    env.ORIGIN_MAIN    = sh(script: 'git rev-parse origin/main', returnStdout: true).trim()
                    env.IS_MAIN        = (env.GIT_FULL == env.ORIGIN_MAIN) ? 'true' : 'false'

                    currentBuild.description = "commit ${env.GIT_SHORT} | main=${env.IS_MAIN}"
                }
                sh '''
                    set -eu
                    mkdir -p reports
                    cat > reports/build-metadata.txt <<EOF
JOB_NAME=${JOB_NAME}
BUILD_NUMBER=${BUILD_NUMBER}
BUILD_URL=${BUILD_URL}
SCM_GIT_BRANCH=${SCM_GIT_BRANCH:-unknown}
GIT_SHORT=${GIT_SHORT}
GIT_FULL=${GIT_FULL}
ORIGIN_MAIN_COMMIT=${ORIGIN_MAIN}
IS_MAIN=${IS_MAIN}
EOF
                '''
            }
        }

        stage('App CI/CD Tests') {
            parallel {
                stage('Backend Checks') {
                    steps {
                        dir('backend') {
                            sh 'npm ci'
                            sh 'npx prisma generate'
                            sh 'npm test'
                        }
                    }
                }
                stage('Frontend Checks') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                            sh 'npm run lint'
                            sh 'npm run build'
                        }
                    }
                }
            }
        }

        stage('Docker Build & Verify') {
            steps {
                sh '''
                    set -eu
                    mkdir -p reports
                    docker compose config --quiet
                    docker compose build --no-cache

                    # Extracción de metadatos de imágenes
                    docker image inspect "${LOCAL_BACKEND_IMAGE}:latest" > reports/backend-image-inspect.json
                    docker image inspect "${LOCAL_FRONTEND_IMAGE}:latest" > reports/frontend-image-inspect.json
                    docker image ls --format '{{.Repository}}:{{.Tag}} {{.ID}} {{.Size}}' > reports/docker-images.txt
                '''
            }
        }

        stage('Security Scans (Trivy)') {
            parallel {
                stage('Trivy - Backend Scan') {
                    steps {
                        sh '''
                            set -eu
                            echo "========================================"
                            echo "TRIVY - ANÁLISIS BACKEND"
                            echo "========================================"
                            
                            docker run --rm \
                                -v /var/run/docker.sock:/var/run/docker.sock \
                                -v trivy-cache-backend:/root/.cache/ \
                                -v "$WORKSPACE/reports:/reports" \
                                aquasec/trivy:0.73.0 image \
                                --scanners vuln \
                                --severity HIGH,CRITICAL \
                                --format json \
                                --output /reports/backend-trivy.json \
                                "${LOCAL_BACKEND_IMAGE}:latest"
                        '''
                    }
                }
                stage('Trivy - Frontend Scan') {
                    steps {
                        sh '''
                            set -eu
                            echo "========================================"
                            echo "TRIVY - ANÁLISIS FRONTEND"
                            echo "========================================"
                            
                            docker run --rm \
                                -v /var/run/docker.sock:/var/run/docker.sock \
                                -v trivy-cache-frontend:/root/.cache/ \
                                -v "$WORKSPACE/reports:/reports" \
                                aquasec/trivy:0.73.0 image \
                                --scanners vuln \
                                --severity HIGH,CRITICAL \
                                --format json \
                                --output /reports/frontend-trivy.json \
                                "${LOCAL_FRONTEND_IMAGE}:latest"
                        '''
                    }
                }
            }
        }



        stage('Publish & Deploy') {
            when {
                expression { return env.IS_MAIN == 'true' }
            }
            parallel {
                stage('Docker Publish') {
                    steps {
                        withCredentials([usernamePassword(credentialsId: 'Practica-3', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                            sh '''
                                set -eu
                                export DOCKER_CONFIG="$(mktemp -d)"
                                trap 'rm -rf "$DOCKER_CONFIG"' EXIT

                                echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

                                B_TAG="${DOCKER_USER}/${REMOTE_BACKEND_IMAGE}"
                                F_TAG="${DOCKER_USER}/${REMOTE_FRONTEND_IMAGE}"

                                docker tag "${LOCAL_BACKEND_IMAGE}:latest" "${B_TAG}:latest"
                                docker tag "${LOCAL_BACKEND_IMAGE}:latest" "${B_TAG}:${BUILD_NUMBER}"
                                docker tag "${LOCAL_BACKEND_IMAGE}:latest" "${B_TAG}:${BUILD_NUMBER}-${GIT_SHORT}"

                                docker tag "${LOCAL_FRONTEND_IMAGE}:latest" "${F_TAG}:latest"
                                docker tag "${LOCAL_FRONTEND_IMAGE}:latest" "${F_TAG}:${BUILD_NUMBER}"
                                docker tag "${LOCAL_FRONTEND_IMAGE}:latest" "${F_TAG}:${BUILD_NUMBER}-${GIT_SHORT}"

                                docker push "${B_TAG}:latest"
                                docker push "${B_TAG}:${BUILD_NUMBER}"
                                docker push "${B_TAG}:${BUILD_NUMBER}-${GIT_SHORT}"

                                docker push "${F_TAG}:latest"
                                docker push "${F_TAG}:${BUILD_NUMBER}"
                                docker push "${F_TAG}:${BUILD_NUMBER}-${GIT_SHORT}"

                                cat > reports/docker-publish-metadata.txt <<EOF
BACKEND_LATEST=${B_TAG}:latest
BACKEND_BUILD=${B_TAG}:${BUILD_NUMBER}
BACKEND_TRACE=${B_TAG}:${BUILD_NUMBER}-${GIT_SHORT}
FRONTEND_LATEST=${F_TAG}:latest
FRONTEND_BUILD=${F_TAG}:${BUILD_NUMBER}
FRONTEND_TRACE=${F_TAG}:${BUILD_NUMBER}-${GIT_SHORT}
EOF
                            '''
                        }
                    }
                }
                stage('Railway Deploy') {
                    steps {
                        withCredentials([string(credentialsId: 'railway-token', variable: 'RAILWAY_TOKEN')]) {
                            sh '''
                                set -eu
                                echo "Solicitando redeploy a Railway..."
                                npx -y @railway/cli redeploy --service "$RAILWAY_BACKEND_SERVICE_ID" --environment "$RAILWAY_ENVIRONMENT_ID" --yes --json > reports/railway-backend-redeploy.json
                                npx -y @railway/cli redeploy --service "$RAILWAY_FRONTEND_SERVICE_ID" --environment "$RAILWAY_ENVIRONMENT_ID" --yes --json > reports/railway-frontend-redeploy.json
                            '''
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo "PIPELINE COMPLETADO CON ÉXITO | Build: ${env.BUILD_NUMBER}"
        }
        failure {
            echo "PIPELINE FALLIDO | Revisa los logs de la etapa correspondida."
        }
        always {
            sh 'docker logout >/dev/null 2>&1 || true'
            archiveArtifacts artifacts: 'reports/**', allowEmptyArchive: true, fingerprint: true
        }
    }
}