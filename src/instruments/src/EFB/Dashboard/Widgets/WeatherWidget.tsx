// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { FC, useEffect, useState } from 'react';
import { Metar } from '@flybywiresim/api-client';
import { Droplet, Speedometer2, ThermometerHalf, Wind } from 'react-bootstrap-icons';
import { parseMetar } from '../../Utils/parseMetar';
import { MetarParserType } from '../../../Common/metarTypes';
import { usePersistentProperty } from '../../../Common/persistence';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';
import { ColoredMetar } from './ColorMetar';
import { useAppDispatch } from '../../Store/store';
import { setUserDepartureIcao, setUserDestinationIcao } from '../../Store/features/dashboard';
import { Toggle } from '../../UtilComponents/Form/Toggle';

const MetarParserTypeProp: MetarParserType = {
    raw_text: '',
    raw_parts: [],
    color_codes: [],
    icao: '',
    observed: new Date(0),
    wind: {
        degrees: 0,
        degrees_from: 0,
        degrees_to: 0,
        speed_kts: 0,
        speed_mps: 0,
        gust_kts: 0,
        gust_mps: 0,
    },
    visibility: {
        miles: '',
        miles_float: 0.0,
        meters: '',
        meters_float: 0.0,
    },
    conditions: [],
    clouds: [],
    ceiling: {
        code: '',
        feet_agl: 0,
        meters_agl: 0,
    },
    temperature: {
        celsius: 0,
        fahrenheit: 0,
    },
    dewpoint: {
        celsius: 0,
        fahrenheit: 0,
    },
    humidity_percent: 0,
    barometer: {
        hg: 0,
        kpa: 0,
        mb: 0,
    },
    flight_category: '',
};

interface WeatherWidgetProps { name: 'origin'|'destination'; simbriefIcao: string; userIcao: string}

export const WeatherWidget:FC<WeatherWidgetProps> = ({ name, simbriefIcao, userIcao }) => {
    const [metar, setMetar] = useState<MetarParserType>(MetarParserTypeProp);
    const [showMetar, setShowMetar] = usePersistentProperty(`CONFIG_SHOW_METAR_${name}`, 'DISABLED');
    const [baroType] = usePersistentProperty('CONFIG_INIT_BARO_UNIT', 'HPA');
    const dispatch = useAppDispatch();
    const [simbriefIcaoAtLoading, setSimbriefIcaoAtLoading] = useState(simbriefIcao);
    const [metarSource] = usePersistentProperty('CONFIG_METAR_SRC', 'MSFS');
    const source = metarSource === 'MSFS' ? 'MS' : metarSource;

    const getBaroTypeForAirport = (icao: string) => (['K', 'C', 'M', 'P', 'RJ', 'RO', 'TI', 'TJ']
        .some((r) => icao.toUpperCase().startsWith(r)) ? 'IN HG' : 'HPA');

    const BaroValue = () => {
        const displayedBaroType = baroType === 'AUTO' ? getBaroTypeForAirport(metar.icao) : baroType;
        if (displayedBaroType === 'IN HG') {
            return (
                <>
                    {metar.barometer.hg.toFixed(2)}
                    {' '}
                    inHg
                </>
            );
        }
        return (
            <>
                {metar.barometer.mb.toFixed(0)}
                {' '}
                mb
            </>
        );
    };

    const handleIcao = (icao: string) => {
        if (name === 'origin') {
            dispatch(setUserDepartureIcao(icao));
        } else {
            dispatch(setUserDestinationIcao(icao));
        }
        if (icao.length === 4) {
            getMetar(icao, source);
        } else if (icao.length === 0) {
            getMetar(simbriefIcao, source);
        }
    };

    function getMetar(icao:any, source: any) {
        if (icao.length !== 4 || icao === '----') {
            return new Promise(() => {
                setMetar(MetarParserTypeProp);
            });
        }
        return Metar.get(icao, source)
            .then((result) => {
                const metarParse = parseMetar(result.metar);
                setMetar(metarParse);
            })
            .catch(() => {
                setMetar(MetarParserTypeProp);
            });
    }

    useEffect(() => {
        // if we have new simbrief data that is different from the simbrief data at
        // loading of the widget we overwrite the user input once. After that
        // user input has priority.
        if (simbriefIcao !== simbriefIcaoAtLoading) {
            dispatch(setUserDepartureIcao(''));
            dispatch(setUserDestinationIcao(''));
            getMetar(simbriefIcao, source);
            setSimbriefIcaoAtLoading(simbriefIcao);
        } else {
            getMetar(userIcao || simbriefIcao, source);
        }
    }, [simbriefIcao, userIcao, source]);

    return (
        <div>
            {metar === undefined
                ? <p>Loading ...</p>
                : (
                    <>
                        <div className="flex flex-row justify-between items-center">
                            <SimpleInput
                                noLabel
                                className="w-32 text-2xl font-medium text-center uppercase"
                                placeholder={simbriefIcao || 'ICAO'}
                                value={userIcao || simbriefIcao}
                                onChange={(value) => handleIcao(value)}
                                maxLength={4}
                            />
                            <div className="flex flex-row space-x-2">
                                <p>Raw</p>
                                <Toggle value={showMetar === 'ENABLED'} onToggle={(value) => setShowMetar(value ? 'ENABLED' : 'DISABLED')} />
                            </div>
                        </div>
                        {showMetar === 'DISABLED'
                            ? (
                                <>
                                    <div className="flex flex-row justify-between items-center mt-4 w-full">
                                        <div className="flex flex-col items-center space-y-1">
                                            <Speedometer2 size={35} />
                                            <p>Air Pressure</p>
                                            {metar.raw_text ? (
                                                <>
                                                    {metar.barometer ? <BaroValue /> : 'N/A'}
                                                </>
                                            ) : (
                                                <>
                                                    N/A
                                                </>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-center space-y-1">
                                            <Wind size={35} />
                                            <p>Wind Speed</p>
                                            {metar.raw_text
                                                ? (
                                                    <>
                                                        {metar.wind.degrees.toFixed(0)}
                                                        &deg;
                                                        {' '}
                                                        /
                                                        {' '}
                                                        {metar.wind.speed_kts.toFixed(0)}
                                                        {' '}
                                                        kts
                                                    </>
                                                ) : 'N/A'}
                                        </div>
                                        <div className="flex flex-col items-center space-y-1">
                                            <ThermometerHalf size={35} />
                                            <p>Temperature</p>
                                            {metar.raw_text
                                                ? (
                                                    <>
                                                        {metar.temperature.celsius.toFixed(0)}
                                                        {' '}
                                                        &deg;C
                                                    </>
                                                ) : 'N/A'}
                                        </div>
                                        <div className="flex flex-col items-center space-y-1">
                                            <Droplet size={35} />
                                            <p>Dew Point</p>
                                            {metar.raw_text
                                                ? (
                                                    <>
                                                        {metar.dewpoint.celsius.toFixed(0)}
                                                        {' '}
                                                        &deg;C
                                                    </>
                                                ) : 'N/A'}
                                        </div>
                                    </div>
                                </>
                            )
                            : (
                                <>
                                    <div className="mt-4 font-mono text-xl">
                                        {metar.raw_text
                                            ? (
                                                <>
                                                    <ColoredMetar metar={metar} />
                                                </>
                                            ) : (
                                                <>
                                                    NO VALID ICAO CHOSEN
                                                    {' '}
                                                    {' '}
                                                </>
                                            )}
                                    </div>
                                </>
                            )}
                    </>
                )}
        </div>
    );
};
