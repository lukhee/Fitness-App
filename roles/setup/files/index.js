version: 2.1
orbs:
  # Choose either one of the orbs below
  # Declare a dependency on the welcome-orb
  # welcome: circleci/welcome-orb@0.4.1
  aws-cli: circleci/aws-cli@2.0.3
# Orchestrate or schedule a set of jobs

commands:
  # Exercise: Reusable Job Code
  print_pipeline_id:
    parameters:
      id: 
        type: string
    steps:
      - run: echo << parameters.id >>

  # Exercise - Rollback
  destroy_environment:
    steps:
      - run:
          name: Destroy environment
          # ${CIRCLE_WORKFLOW_ID} is a Built-in environment variable 
          # ${CIRCLE_WORKFLOW_ID:0:5} takes the first 5 chars of the variable CIRCLE_CI_WORKFLOW_ID 
          when: on_fail
          command: |
            aws cloudformation delete-stack --stack-name myStack-${CIRCLE_WORKFLOW_ID:0:5}
 
jobs:
  # Exercise: Creating a Simple Workflow
  # Exercise: Environment Variables
  # Exercise: Reusable Job Code 
  print_greetings:
    docker:
      - image: circleci/node:13.8.0
    steps:
      - print_pipeline_id:
          id: << pipeline.id >>
      - run: echo HELLO
      - run: echo WORLD
      - run: echo $_env_name

  create_infrastructure: 
    docker:
      - image: amazon/aws-cli
    steps:
      - checkout
      - run:
          name: Create Cloudformation Stack
          command: |
            aws cloudformation deploy \
              --template-file template.yml \
              --stack-name myStack-${CIRCLE_WORKFLOW_ID:0:5} \
              --region us-east-1
#         - run: return 1
      - destroy_environment

  configure_infrastructure: 
    docker: 
      - image: python:3.7-alpine3.11
    steps:
      - checkout
      - add_ssh_keys:
              # You can get this ID in the section where you registered the SSH Key
              fingerprints: ["34:11:f3:db:ee:fd:ba:00:84:43:37:6a:1f:35:f6:83"] 
      - run:
          name: Install Ansible
          command: |
            apk add --update ansible # Install Ansible
      - run:
          name: Run Playbook and Configure server
          command: |
            ansible-playbook -i inventory main.yml # Your command

  smoke_test:
    docker:
      - image: alpine:latest
    steps:
      - run: apk add --update curl
      - run:
          name: smoke test
          command: |
            URL="https://blog.udacity.com/"
            # Test if website exists
            if curl -s --head ${URL} 
            then
              return 0
            else
              return 1
            fi
# Sequential workflow
workflows:
  my_workflow:
      jobs:
        - print_greetings
        - create_infrastructure
        - configure_infrastructure
        - smoke_test
