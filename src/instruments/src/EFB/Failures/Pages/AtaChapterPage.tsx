import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'react-bootstrap-icons';
import { AtaChapterNumber, AtaChaptersTitle } from '@shared/ata';
import { FailureButton } from './Failure';
import { useFailuresOrchestrator } from '../../failures-orchestrator-provider';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';

interface AtaChapterPageProps {
    chapter: AtaChapterNumber;
}

export const AtaChapterPage = ({ chapter }: AtaChapterPageProps) => {
    const { allFailures, activeFailures, changingFailures, activate, deactivate } = useFailuresOrchestrator();

    return (
        <div>
            <Link to="/failures/home" className="inline-block">
                <div className="flex flex-row items-center space-x-3 transition duration-100 hover:text-theme-highlight">
                    <ArrowLeft size={30} />
                    <h1 className="font-bold text-current">
                        Failures
                        {' > '}
                        {AtaChaptersTitle[chapter]}
                    </h1>
                </div>
            </Link>
            <div className="p-4 mt-4 rounded-lg border-2 border-theme-accent h-content-section-reduced">
                <ScrollableContainer height={44}>
                    <div className="grid grid-cols-4 auto-rows-auto">
                        {allFailures.filter((failure) => failure.ata === chapter).map((failure, index) => (
                            <FailureButton
                                name={failure.name}
                                isActive={activeFailures.has(failure.identifier)}
                                isChanging={changingFailures.has(failure.identifier)}
                                onClick={() => {
                                    if (!activeFailures.has(failure.identifier)) {
                                        activate(failure.identifier);
                                    } else {
                                        deactivate(failure.identifier);
                                    }
                                }}
                                className={`${index && index % 4 !== 0 && 'ml-4'} ${index >= 4 && 'mt-4'} h-36`}
                            />
                        ))}
                    </div>
                </ScrollableContainer>
            </div>
        </div>
    );
};
