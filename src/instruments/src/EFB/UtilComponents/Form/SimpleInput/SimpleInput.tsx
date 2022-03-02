import { usePersistentNumberProperty } from '@instruments/common/persistence';
import React, { useEffect, useRef, useState, PropsWithChildren } from 'react';
import { KeyboardWrapper } from '../../KeyboardWrapper';

interface SimpleInputProps {
    placeholder?: string;
    value?: any;
    onChange?: (value: string) => void;
    onFocus?: (value: string) => void;
    onBlur?: (value: string) => void
    min?: number;
    max?: number;
    number?: boolean;
    padding?: number;
    decimalPrecision?: number;
    reverse?: boolean; // Flip label/input order;
    className?: string;
    maxLength?: number;
    disabled?: boolean;
}

export const SimpleInput = (props: PropsWithChildren<SimpleInputProps>) => {
    const [displayValue, setDisplayValue] = useState(props.value?.toString() ?? '');
    const [focused, setFocused] = useState(false);

    const [autoOSK] = usePersistentNumberProperty('EFB_AUTO_OSK', 0);

    const keyboard = useRef<any>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [OSKOpen, setOSKOpen] = useState(false);

    useEffect(() => {
        if (keyboard.current) {
            keyboard.current.setInput(displayValue);
        }
    }, [keyboard.current, OSKOpen]);

    useEffect(() => {
        if (props.value === undefined || props.value === '') {
            setDisplayValue('');
            return;
        }

        if (focused) return;

        setDisplayValue(getConstrainedValue(props.value));
    }, [props.value]);

    const onChange = (value: string): void => {
        if (props.disabled) return;

        let originalValue = value;

        if (props.number) {
            originalValue = originalValue.replace(/[^\d.-]/g, ''); // Replace all non-numeric characters
        }

        if (props.maxLength) {
            originalValue = originalValue.substring(0, props.maxLength);
        }

        props.onChange?.(originalValue);

        if (keyboard.current) {
            keyboard.current.setInput(originalValue.slice(0, props.maxLength));
        }
        setDisplayValue(originalValue);
    };

    const onFocus = (event: React.FocusEvent<HTMLInputElement>): void => {
        setFocused(true);
        if (!props.disabled) {
            props.onFocus?.(event.target.value);
        }

        if (autoOSK) {
            setOSKOpen(true);
        }
    };

    const onFocusOut = (event: React.FocusEvent<HTMLInputElement>): void => {
        const { value } = event.currentTarget;
        const constrainedValue = getConstrainedValue(value);

        setDisplayValue(constrainedValue);
        setFocused(false);
        setOSKOpen(false);

        if (!props.disabled) {
            props.onBlur?.(constrainedValue);
        }
    };

    const getConstrainedValue = (value: string): string => {
        if (!props.number) {
            return value;
        }
        let constrainedValue = value;
        let numericValue = parseFloat(value);

        if (!Number.isNaN(numericValue)) {
            if (props.min !== undefined && numericValue < props.min) {
                numericValue = props.min;
            } else if (props.max !== undefined && numericValue > props.max) {
                numericValue = props.max;
            }

            if (props.decimalPrecision !== undefined) {
                const fixed = numericValue.toFixed(props.decimalPrecision);
                constrainedValue = parseFloat(fixed).toString(); // Have to re-parse to remove trailing 0s
            } else {
                constrainedValue = numericValue.toString();
            }
            constrainedValue = pad(constrainedValue);
        }
        return constrainedValue;
    };

    const pad = (value: string): string => {
        if (props.padding === undefined) return value;
        const split = value.split('.');
        while (split[0].length < props.padding) {
            split[0] = `0${split[0]}`;
        }
        return split.join('.');
    };

    useEffect(() => {
        if (!process.env.SIMVAR_DISABLE) {
            if (focused) {
                Coherent.trigger('FOCUS_INPUT_FIELD');
            } else {
                Coherent.trigger('UNFOCUS_INPUT_FIELD');
            }
        }
        return () => {
            Coherent.trigger('UNFOCUS_INPUT_FIELD');
        };
    }, [focused]);

    const blurInputField = () => {
        if (inputRef.current) {
            inputRef.current.blur();
        }
    };

    return (
        <>
            <input
                className={`px-3 py-1.5 text-lg rounded-md border-2 transition duration-100
                    focus-within:outline-none focus-within:border-theme-highlight 
                    ${props.disabled
            ? 'placeholder-theme-body bg-theme-unselected border-theme-unselected text-theme-body'
            : 'placeholder-theme-unselected bg-theme-accent border-theme-accent text-theme-text'} 
                    ${props.className}`}
                value={displayValue}
                placeholder={props.placeholder}
                onChange={(e) => onChange(e.target.value)}
                onFocus={onFocus}
                onBlur={onFocusOut}
                disabled={props.disabled}
                ref={inputRef}
            />
            {OSKOpen && (
                <KeyboardWrapper
                    keyboardRef={keyboard}
                    onChangeAll={(v) => onChange(v.default)}
                    blurInput={blurInputField}
                    setOpen={setOSKOpen}
                    onKeyDown={(e) => {
                        if (e === '{bksp}') {
                            onChange(displayValue.slice(0, displayValue.length - 1));
                        }
                    }}
                />
            )}
        </>
    );
};
