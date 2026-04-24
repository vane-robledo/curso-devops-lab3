def tagAndPush(String localImage, String repo, String registry, String credential) {

    docker.withRegistry(registry, credential) {
        sh "docker tag ${localImage} ${repo}:latest"
        sh "docker tag ${localImage} ${repo}:${env.BUILD_NUMBER}"
        sh "docker tag ${localImage} ${repo}:${env.APP_SEMANTIC_VERSION}"

        sh "docker push ${repo}:latest"
        sh "docker push ${repo}:${env.BUILD_NUMBER}"
        sh "docker push ${repo}:${env.APP_SEMANTIC_VERSION}"
    }
}

pipeline {
    agent any

    environment {
        IMAGE_NAME = "curso-devops-lab3"

        DH_REPO    = "vanerob/curso-devops-lab3"
        GHCR_REPO  = "ghcr.io/vane-robledo/curso-devops-lab3"

        K8S_NAMESPACE  = "vrobledo"
        K8S_DEPLOYMENT = "lab3-deployment"
        K8S_CONTAINER  = "lab3-container"
    }

    stages {
        stage("Integracion continua") {
            agent {
                docker {
                    image "node:24"
                    reuseNode true
                }
            }

            stages {
                stage("CI - version") {
                    steps {
                        script {
                            env.APP_SEMANTIC_VERSION = sh(
                                script: 'npm pkg get version | tr -d \'"\'',
                                returnStdout: true
                            ).trim()

                            echo "Version semantica detectada: ${env.APP_SEMANTIC_VERSION}"
                            echo "Build number detectado: ${env.BUILD_NUMBER}"
                        }
                    }
                }

                stage("CI - dependencias") {
                    steps {
                        sh "npm install"
                    }
                }

                stage("CI - lint") {
                    steps {
                        sh "npm run lint"
                    }
                }

                stage("CI - test y cobertura") {
                    steps {
                        sh "npm run test:cov"
                    }
                }

                stage("CI - build") {
                    steps {
                        sh "npm run build"
                    }
                }
            }
        }

        stage("Quality Assurance") {
    agent {
        docker {
            image 'sonarsource/sonar-scanner-cli:5'
            args '--network=devops-infra_default'
            reuseNode true
        }
    }
    steps {
        withSonarQubeEnv('sonarqube') {
            sh """
            sonar-scanner \
              -Dsonar.projectKey=curso-devops-lab3 \
              -Dsonar.projectName=curso-devops-lab3 \
              -Dsonar.sources=src \
              -Dsonar.tests=test \
              -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
            """
        }
    }
}

        stage("Quality Gate") {
             steps {
                script {
                def qualityGate = waitForQualityGate()

                if (qualityGate.status != 'OK') {
                error "La puerta de calidad ha fallado: ${qualityGate.status}"
                }
        }
    }
}

        stage("CD - build y push de imagen") {
            steps {
                sh "docker build -t ${env.IMAGE_NAME} ."

                script {
                    if (!env.APP_SEMANTIC_VERSION?.trim()) {
                        error("APP_SEMANTIC_VERSION no definida")
                    }

                    tagAndPush(env.IMAGE_NAME, env.DH_REPO, "https://index.docker.io/v1/", "credencial-dh")
                    tagAndPush(env.IMAGE_NAME, env.GHCR_REPO, "https://ghcr.io", "credencial-gh")
                }
            }
        }

        stage("CD - despliegue en Kubernetes") {
            agent {
                docker {
                    image 'alpine/k8s:1.34.6'
                    reuseNode true
                }
            }

            steps {
                withKubeConfig([credentialsId: 'credencial-k8']) {
                    sh """
                        kubectl -n ${env.K8S_NAMESPACE} set image deployment/${env.K8S_DEPLOYMENT} ${env.K8S_CONTAINER}=${env.GHCR_REPO}:${env.BUILD_NUMBER}
                        kubectl -n ${env.K8S_NAMESPACE} rollout status deployment/${env.K8S_DEPLOYMENT}
                        kubectl -n ${env.K8S_NAMESPACE} get pods
                    """
                }
            }
        }
    }
}