import {CognitoUserPool} from 'amazon-cognito-identity-js';

const poolData = {
    UserPoolId: 'us-east-1_Kius0fmQ0',
    ClientId: '3g1kiuq5c9n7hkpjc0m59h1dd6'
}

export default new CognitoUserPool(poolData);
