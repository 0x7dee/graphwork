# Graphwork

## Team Members
- td123
- rxthew

## Tool Description
Our tool allows users to easily visualise GEXF file data using a D3 force directed graph. Users can then select individual nodes to view specific data related to that node including the details of the node and the neighbours of the node. 

## Installation
Clone this repo

1. Make sure you have NodeJS installed (v16.14.2 was used for this project)

2. Download the tool's repository using the command:

        git clone https://github.com/tden123/graphwork

3. Move to the tool's directory and install the tool

        cd graphwork
        npm i

4. To run the project, run 

        npm run dev
        
   from the root of the graphwork directory 


## Usage
After the tool has started, open your browser and navigate to `https://localhost:3000`. From the homescreen you can import GEXF files via the `Choose file` button. 

Example GEXF files used for testing can be found in this repo under the `data` directory.

## Additional Information
Future improvements
- The application can lag at times due to the number of nodes and some unoptimised code which could be worked on to improve performance
- Data displayed using the hover effect in the UI has hard coded values for the EuroSIS dataset so will need be generalised for other datasets
- UI sidebar UI/UX consistency could be improved
- Application is limited in terms of insights gained from the data, you are able to see direct connections and details of individual nodes however there are no complex calculations used