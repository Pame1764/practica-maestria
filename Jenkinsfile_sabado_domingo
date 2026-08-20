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

        RAILWAY_PROJECT_ID          = '37075425-4eaf-4f1a-a5f7-e49455ea4173'
        RAILWAY_ENVIRONMENT_ID      = '639055fb-12c3-4077-91c3-20d8ca004ac9'
        RAILWAY_BACKEND_SERVICE_ID  = '92fe0ca7-47b4-4cda-9f07-f791e68c7d55'
        RAILWAY_FRONTEND_SERVICE_ID = '2a6e2269-b339-4078-aa38-5300ce07491c'

    }

    stages {

        stage('Checkout') {
            steps {
                script {
                    def scmVars = checkout scm

                    env.SCM_GIT_BRANCH = scmVars.GIT_BRANCH ?: ''
                    env.SCM_GIT_COMMIT = scmVars.GIT_COMMIT ?: ''

                    echo "SCM branch: ${env.SCM_GIT_BRANCH}"
                    echo "SCM commit: ${env.SCM_GIT_COMMIT}"
                }
            }
        }

        stage('Metadata') {
            steps {
                script {
                    env.GIT_FULL = env.SCM_GIT_COMMIT ?: sh(
                        script: 'git rev-parse HEAD',
                        returnStdout: true
                    ).trim()

                    env.GIT_SHORT = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()

                    env.ORIGIN_MAIN_COMMIT = sh(
                        script: 'git rev-parse origin/main',
                        returnStdout: true
                    ).trim()

                    env.IS_MAIN = (
                        env.GIT_FULL == env.ORIGIN_MAIN_COMMIT
                    ) ? 'true' : 'false'

                    currentBuild.description = "commit ${env.GIT_SHORT} | main=${env.IS_MAIN}"

                    echo "========================================"
                    echo "METADATOS DEL BUILD"
                    echo "========================================"
                    echo "Job: ${env.JOB_NAME}"
                    echo "Build: ${env.BUILD_NUMBER}"
                    echo "Rama SCM: ${env.SCM_GIT_BRANCH}"
                    echo "Commit corto: ${env.GIT_SHORT}"
                    echo "Commit completo: ${env.GIT_FULL}"
                    echo "Commit origin/main: ${env.ORIGIN_MAIN_COMMIT}"
                    echo "Es main: ${env.IS_MAIN}"
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
ORIGIN_MAIN_COMMIT=${ORIGIN_MAIN_COMMIT}
IS_MAIN=${IS_MAIN}
EOF
                '''
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
                sh 'docker compose build --no-cache'
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

        stage('Evidence - Image Metadata') {
            steps {
                sh '''
                    set -eu

                    mkdir -p reports

                    docker image inspect "${LOCAL_BACKEND_IMAGE}:latest" > reports/backend-image-inspect.json
                    docker image inspect "${LOCAL_FRONTEND_IMAGE}:latest" > reports/frontend-image-inspect.json
                    docker image ls --format '{{.Repository}}:{{.Tag}} {{.ID}} {{.Size}}' > reports/docker-images.txt

                    echo "Metadatos de imágenes guardados en reports/."
                '''
            }
        }

        stage('Docker - Publish') {
            when {
                expression {
                    return env.IS_MAIN == 'true'
                }
            }

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

                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

                        BACKEND_LATEST="${DOCKER_USER}/${REMOTE_BACKEND_IMAGE}:latest"
                        BACKEND_BUILD="${DOCKER_USER}/${REMOTE_BACKEND_IMAGE}:${BUILD_NUMBER}"
                        BACKEND_TRACE="${DOCKER_USER}/${REMOTE_BACKEND_IMAGE}:${BUILD_NUMBER}-${GIT_SHORT}"

                        FRONTEND_LATEST="${DOCKER_USER}/${REMOTE_FRONTEND_IMAGE}:latest"
                        FRONTEND_BUILD="${DOCKER_USER}/${REMOTE_FRONTEND_IMAGE}:${BUILD_NUMBER}"
                        FRONTEND_TRACE="${DOCKER_USER}/${REMOTE_FRONTEND_IMAGE}:${BUILD_NUMBER}-${GIT_SHORT}"

                        docker tag "${LOCAL_BACKEND_IMAGE}:latest" "$BACKEND_LATEST"
                        docker tag "${LOCAL_BACKEND_IMAGE}:latest" "$BACKEND_BUILD"
                        docker tag "${LOCAL_BACKEND_IMAGE}:latest" "$BACKEND_TRACE"

                        docker tag "${LOCAL_FRONTEND_IMAGE}:latest" "$FRONTEND_LATEST"
                        docker tag "${LOCAL_FRONTEND_IMAGE}:latest" "$FRONTEND_BUILD"
                        docker tag "${LOCAL_FRONTEND_IMAGE}:latest" "$FRONTEND_TRACE"

                        docker push "$BACKEND_LATEST"
                        docker push "$BACKEND_BUILD"
                        docker push "$BACKEND_TRACE"

                        docker push "$FRONTEND_LATEST"
                        docker push "$FRONTEND_BUILD"
                        docker push "$FRONTEND_TRACE"

                        cat > reports/docker-publish-metadata.txt <<EOF
BACKEND_LATEST=${BACKEND_LATEST}
BACKEND_BUILD=${BACKEND_BUILD}
BACKEND_TRACE=${BACKEND_TRACE}
FRONTEND_LATEST=${FRONTEND_LATEST}
FRONTEND_BUILD=${FRONTEND_BUILD}
FRONTEND_TRACE=${FRONTEND_TRACE}
EOF

                        docker logout >/dev/null 2>&1 || true

                        echo "Imágenes publicadas correctamente en Docker Hub."
                        echo "Backend trazable: $BACKEND_TRACE"
                        echo "Frontend trazable: $FRONTEND_TRACE"
                    '''
                }
            }
        }

        stage('Railway - CLI Check') {
            when {
                expression {
                    return env.IS_MAIN == 'true'
                }
            }

            steps {
                sh '''
                    set -eu
                    echo "Verificando Railway CLI..."
                    npx -y @railway/cli --version
                '''
            }
        }

        stage('Railway - Redeploy Backend') {
            when {
                expression {
                    return env.IS_MAIN == 'true'
                }
            }

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
                        echo "REDEPLOY BACKEND EN RAILWAY"
                        echo "========================================"

                        npx -y @railway/cli redeploy --service "$RAILWAY_BACKEND_SERVICE_ID" --environment "$RAILWAY_ENVIRONMENT_ID" --yes --json > reports/railway-backend-redeploy.json

                        cat reports/railway-backend-redeploy.json

                        echo "Redeploy del backend solicitado correctamente."
                    '''
                }
            }
        }

        stage('Railway - Redeploy Frontend') {
            when {
                expression {
                    return env.IS_MAIN == 'true'
                }
            }

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

                        npx -y @railway/cli redeploy --service "$RAILWAY_FRONTEND_SERVICE_ID" --environment "$RAILWAY_ENVIRONMENT_ID" --yes --json > reports/railway-frontend-redeploy.json

                        cat reports/railway-frontend-redeploy.json

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
            echo "Build: ${env.BUILD_NUMBER}"
            echo "Commit: ${env.GIT_SHORT ?: 'N/A'}"
            echo "Main: ${env.IS_MAIN ?: 'N/A'}"

            script {
                if (env.IS_MAIN == 'true') {
                    echo 'Imágenes publicadas en Docker Hub y redeploy solicitado en Railway.'
                } else {
                    echo 'Build de rama no-main: pruebas y construcción ejecutadas; publicación y despliegue omitidos.'
                }
            }
        }

        failure {
            echo '========================================'
            echo 'PIPELINE FALLIDO'
            echo '========================================'
            echo 'Revisar la primera etapa fallida y su Console Output.'
        }

        always {
            sh 'docker logout >/dev/null 2>&1 || true'

            archiveArtifacts(
                artifacts: 'reports/**',
                allowEmptyArchive: true,
                fingerprint: true
            )
        }
    }
}

