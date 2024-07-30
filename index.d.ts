type CustomSelectConfig<TOption, TMultiple extends boolean = false> = {
    data: Array<{
        groupName: string;
        options: TOption[];
    }>;
    enableSearch?: boolean;
    isDisabled?: boolean;
    isMultiple?: TMultiple;
    hook?: {
        onChange?: TMultiple extends true ? (selectedOptions: Set<TOption>) => void : (selectedOption: null | TOption) => void;
        onOpenChange?: (isOpen: boolean) => void;
    };
    content?: {
        optionItem?: {
            label?: (option: TOption, props: {
                isSelected: boolean;
                isDisabled: boolean;
            }) => string | HTMLElement;
            isVisible?: (option: TOption, search: string) => boolean;
            isDisabled?: (option: TOption, selectedOption: null | TOption) => boolean;
        };
        triggerButton?: TMultiple extends true ? (selectedOptions: Set<TOption>) => string | HTMLElement : (selectedOption: TOption) => string | HTMLElement;
        placeholder?: string | (() => string | HTMLElement);
        helpText?: string | (() => string | HTMLElement);
        searchPlaceholder?: string;
        deselectButton?: string | (() => string | HTMLElement);
        noResult?: string | (() => string | HTMLElement);
    };
    className?: {
        container?: string;
        buttonContainer?: string;
        triggerButton?: string;
        deselectButton?: string;
        dropdownContainer?: string;
        helpText?: string;
        searchInput?: string;
        optionsContainer?: string;
        optionGroup?: string;
        optionItem?: string;
        optionHighlighted?: string;
        optionSelected?: string;
        noResult?: string;
    };
};
export declare function createCustomSelect<TOption, TMultiple extends boolean = false>(container: string, config: CustomSelectConfig<TOption, TMultiple>): {
    open: () => void;
    close: () => void;
    toggle: () => void;
    getValue: TMultiple extends true ? () => Set<TOption> : () => TOption;
    setValue: TMultiple extends true ? (selectedOptions: TOption[] | ((options: TOption[]) => TOption[])) => void : (selectedOption: TOption | null | ((options: TOption[]) => TOption | null)) => void;
    resetValue: () => void;
    setIsDisabled: (value: boolean) => void;
    element: {
        root: HTMLDivElement;
        buttonContainer: HTMLDivElement;
        button: HTMLButtonElement;
        deselectButton: HTMLButtonElement;
        dropdown: HTMLDivElement;
        searchInput: HTMLInputElement;
        optionsContainer: HTMLUListElement;
    };
    destroy: () => void;
};
export {};
