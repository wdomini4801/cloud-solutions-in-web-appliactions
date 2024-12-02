import React, {useEffect, useState} from "react";
import axios from "axios";
import {getUsername} from "./Auth.jsx";

const Results = () => {
    const [data, setData] = useState([]);

    const loadData = () => {
        const server_port = "3000";
        // const server_port = import.meta.env.VITE_SERVER_PORT;
        const url = `http://${window.location.hostname}:${server_port}/results`;
        const accessToken = localStorage.getItem("access_token");
        axios.get(url,{params : {username: getUsername()},headers:{Authorization: accessToken}})
            .then(response => {
                setData(response.data.data);
                console.log(response.data.data);
            })
            .catch(error => {
                console.log(error);
            });
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
                        <td>{item.GameTime}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default Results;
