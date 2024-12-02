import React, {useEffect, useState} from 'react';
import axios from 'axios';
import '../Game/Game.css';

import {useSearchParams} from "react-router-dom";

const Login = () => {

    const [searchParams, setSearchParams] = useSearchParams();
    const [authCode, setAuthCode] = useState(searchParams.get("code"));
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const client_port = "5173";

    const handleSubmit = async (e) => {
        let redirect_uri;

        if (client_port === "80") {
            redirect_uri = 'http://'+window.location.hostname+'/login';
        }

        else if (client_port === "443") {
            redirect_uri = 'https://'+window.location.hostname+'/login';
        }

        else {
            redirect_uri = 'http://'+window.location.hostname+':'+client_port+'/login';
        }

        document.location.href = 'https://us-east-1kius0fmq0.auth.us-east-1.amazoncognito.com/login?' +
            'client_id=3g1kiuq5c9n7hkpjc0m59h1dd6&response_type=code&redirect_uri='+redirect_uri;
    };

    if(!authCode) {
        return (
            <div className="main-div">
                <button onClick={handleSubmit} className="clickButton">
                    Log in to play
                </button>
            </div>
    );
    }
    else {
        useEffect(() => {
            const params = {
                auth_code: authCode,
            };
            // const server_port = import.meta.env.VITE_SERVER_PORT;
            const server_port = "3000";
            const url = 'http://'+window.location.hostname+':'+server_port+'/exchange-code';

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
            window.location.href = '/login';
        }
    }
};

export default Login;
