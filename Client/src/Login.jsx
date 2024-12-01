import React, {useEffect, useState} from 'react';
import axios from 'axios';

import {Link, useSearchParams} from "react-router-dom";

const Login = () => {

    const [searchParams, setSearchParams] = useSearchParams();
    const [authCode, setAuthCode] = useState(searchParams.get("code"));
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        document.location.href = 'https://us-east-1kius0fmq0.auth.us-east-1.amazoncognito.com/login?client_id=3g1kiuq5c9n7hkpjc0m59h1dd6&response_type=code&redirect_uri='+window.location.href;
    };

    if(!authCode) {
        return (
            <div className="login-container">
                <h1>Login</h1>
                <form onSubmit={handleSubmit}>
                    <input type='button' value='Login' className="btn" onClick={handleSubmit}/>
                </form>
            </div>
        );
    }
    else {
        useEffect(() => {
            const params = {
                auth_code: authCode ,
            };

            const server_ip = import.meta.env.VITE_SERVER_IP;
            const server_port = import.meta.env.VITE_SERVER_PORT;
            const url = 'http://'+server_ip+':'+server_port+'/exchange-code';

            axios.get(url, { params })
                .then(response => {
                    setData(response.data);

                })
                .catch(error => {
                    setError(error);
                });
        }, []);
        if(data !== null && data.data !== undefined) {
            window.localStorage.setItem('access_token', data.data.access_token);
            window.localStorage.setItem('refresh_token', data.data.refresh_token);
            window.localStorage.setItem('id_token', data.data.id_token);
            window.localStorage.setItem('expires_in', data.data.expires_in);
            window.localStorage.setItem('token_type', data.data.token_type);
        }
    }
};

export default Login;
