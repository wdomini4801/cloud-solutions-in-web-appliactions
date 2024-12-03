import React, {useEffect, useState} from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {getUsername} from "../Login/Auth.jsx";
import './Results.css';

const Results = () => {
    const [data, setData] = useState([]);

    const loadData = () => {
        // const server_port = "3000";
        const server_ip = import.meta.env.VITE_SERVER_IP;
        const server_port = import.meta.env.VITE_SERVER_PORT;
        const url = `https://${server_ip}:${server_port}/results`;
        const accessToken = localStorage.getItem("access_token");

        if(!accessToken) {
            Swal.fire({
                title: "You need to log in first",
                icon: "error",
            });
            document.location.href = "/login";
        }
        else {
            axios.get(url,{params : {player: getUsername()},headers:{Authorization: accessToken}})
                .then(response => {
                    setData(response.data.data);
                    console.log(response.data.data);
                })
                .catch(error => {
                    console.log(error);
                });
        }
    };

    useEffect(() => {
        loadData();
    },[]);

    return (
        <div>
            <table>
                <thead>
                <tr>
                    <th>PlayerName</th>
                    <th>Result</th>
                    <th>GameTime</th>
                </tr>
                </thead>
                <tbody>
                {data.map((item, index) => (
                    <tr key={index}>
                        <td>{item.Player1}</td>
                        <td>{item.Result}</td>
                        <td>{new Date(item.GameTime).toLocaleString()}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default Results;
