import React, { useEffect } from 'react';
import PageBase from '../../components/base-components/PageBase';
import { invoke } from '@tauri-apps/api/core';

const HomePage: React.FC = () => {

    invoke('greet', {name: 'World'}).then(console.log);

    return (
        <PageBase>
            <h1>Home</h1>
            <p>Check the console to see the first three data items.</p>
        </PageBase>
    );
};

export default HomePage;
