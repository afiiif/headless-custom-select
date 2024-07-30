// ---------------------------------
// HELPERS
// ---------------------------------
const $ = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, any> = {},
  listeners: Partial<Record<keyof HTMLElementEventMap, EventListenerOrEventListenerObject>> = {}
): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) continue;
    if (key === 'data') {
      for (const [k, v] of Object.entries(value)) {
        (element.dataset[k] as any) = v;
      }
    } else if (key.startsWith('aria')) {
      element.setAttribute(key, String(value));
    } else if (key !== 'className' || value !== undefined) {
      (element as any)[key] = value;
    }
  }
  for (const [event, listener] of Object.entries(listeners)) {
    element.addEventListener(event, listener);
  }
  return element;
};

$.append = (
  element: HTMLElement,
  contents: Array<undefined | string | HTMLElement | (() => string | HTMLElement)>
) => {
  for (const content of contents) {
    if (content === undefined) continue;
    if (typeof content === 'string') {
      element.textContent += content;
    } else if (content instanceof HTMLElement) {
      element.appendChild(content);
    } else {
      const value = content();
      if (value instanceof HTMLElement) element.appendChild(value);
      else element.textContent += value;
    }
  }
  return element;
};

//

//

//

// ---------------------------------

type CustomSelectConfig<TOption, TMultiple extends boolean = false> = {
  data: Array<{ groupName: string; options: TOption[] }>;
  enableSearch?: boolean;
  isDisabled?: boolean;
  isMultiple?: TMultiple;
  hook?: {
    onChange?: TMultiple extends true
      ? (selectedOptions: Set<TOption>) => void
      : (selectedOption: null | TOption) => void;
    onOpenChange?: (isOpen: boolean) => void;
  };
  content?: {
    optionItem?: {
      label?: (
        option: TOption,
        props: { isSelected: boolean; isDisabled: boolean }
      ) => string | HTMLElement;
      isVisible?: (option: TOption, search: string) => boolean;
      isDisabled?: (option: TOption, selectedOption: null | TOption) => boolean;
    };
    triggerButton?: TMultiple extends true
      ? (selectedOptions: Set<TOption>) => string | HTMLElement
      : (selectedOption: TOption) => string | HTMLElement;
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

const noop = () => {};

export function createCustomSelect<TOption, TMultiple extends boolean = false>(
  container: string,
  config: CustomSelectConfig<TOption, TMultiple>
) {
  type Param = CustomSelectConfig<TOption, TMultiple>;
  type ParamHook = NonNullable<Param['hook']>;
  type ParamContentOption = NonNullable<NonNullable<Param['content']>>['optionItem'];

  //

  // ---------------------------------
  // CONFIG
  // ---------------------------------
  let defaultOptionItem = {} as {
    label: NonNullable<NonNullable<ParamContentOption>['label']>;
    isVisible: NonNullable<NonNullable<ParamContentOption>['isVisible']>;
  };
  const hasLabelProp = typeof (config.data[0]?.options[0] as any)?.label === 'string';
  if (hasLabelProp) {
    defaultOptionItem = {
      label: (option: any, props: any) => `${option.label}${props.isSelected ? ' ✅' : ''}`,
      isVisible: (option: any, search: string) => option.label.toLowerCase().includes(search),
    };
  } else {
    defaultOptionItem = {
      label: (option: any, props: any) => `${option}${props.isSelected ? ' ✅' : ''}`,
      isVisible: (option: any, search: string) => option.toLowerCase().includes(search),
    };
  }

  const {
    data,
    enableSearch = true,
    isDisabled,
    isMultiple,
    hook = {},
    content = {},
    className = {},
  } = config;

  const {
    onChange = noop as NonNullable<ParamHook['onChange']>,
    onOpenChange = noop as NonNullable<ParamHook['onOpenChange']>,
  } = hook;

  const {
    optionItem = {} as NonNullable<ParamContentOption>,
    triggerButton = isMultiple
      ? (selectedOption: Set<TOption>) => `${selectedOption.size} selected`
      : (selectedOption: any) => (defaultOptionItem.label as any)(selectedOption, {}),
    placeholder = 'Select an option...',
    helpText,
    searchPlaceholder = 'Search...',
    deselectButton = '×',
    noResult = 'No results found',
  } = content;

  const {
    label: getOptionLabel = defaultOptionItem.label,
    isVisible: isVisibleFn = defaultOptionItem.isVisible,
    isDisabled: isDisabledFn = () => false,
  } = optionItem;

  const optionsFlat = data.flatMap((group) => group.options);

  const uniqueId = Math.random().toString(36).slice(2, 8);

  //

  // ---------------------------------
  // STATE
  // ---------------------------------
  let state = {
    selectedOption: null as null | TOption,
    selectedOptions: new Set<TOption>(),
    filteredOptions: data,
    filteredOptionsFlat: optionsFlat,
    isOpen: false,
    isDisabled: isDisabled,
    activeIndex: -1,
  };

  const setValueWithOptionChecking = (
    selectedOption: TOption | null | ((options: TOption[]) => TOption | null)
  ) => {
    const selectedOption_ =
      typeof selectedOption === 'function'
        ? (selectedOption as (options: TOption[]) => TOption | null)(optionsFlat)
        : selectedOption;

    if (state.selectedOption !== selectedOption_) {
      let foundSelectedOption: TOption | undefined;
      if (selectedOption_ !== null) {
        loop: for (const group of data) {
          for (const option of group.options) {
            if (option === selectedOption_) {
              foundSelectedOption = option;
              break loop;
            }
          }
        }
      }
      if (foundSelectedOption) setValue(foundSelectedOption);
      else resetValue();
    }
  };

  const setValue = (selectedOption: TOption) => {
    state.selectedOption = selectedOption;
    updateButton();
    onChange(state.selectedOption as any);
    if (state.isOpen) renderOptions();
  };

  const toggleValue = (selectedOption: TOption) => {
    if (state.selectedOptions.has(selectedOption)) {
      state.selectedOptions.delete(selectedOption);
    } else {
      state.selectedOptions.add(selectedOption);
    }
    updateButton();
    if (state.isOpen) {
      setTimeout(() => {
        renderOptions();
      }, 1);
    }
    onChange(state.selectedOptions as any);
  };
  const setValueForMultiple = (
    selectedOptions: TOption[] | ((options: TOption[]) => TOption[])
  ) => {
    const selectedOptions_ =
      typeof selectedOptions === 'function'
        ? (selectedOptions as (options: TOption[]) => TOption[])(optionsFlat)
        : selectedOptions;
    state.selectedOptions.clear();
    selectedOptions_.forEach((option) => {
      if (optionsFlat.includes(option)) {
        state.selectedOptions.add(option);
      }
    });
    updateButton();
    onChange(state.selectedOptions as any);
  };

  const resetValue = () => {
    if (isMultiple) {
      state.selectedOptions.clear();
      updateButton();
      onChange(state.selectedOptions as any);
    } else {
      state.selectedOption = null;
      updateButton();
      onChange(null as any);
    }
    if (state.isOpen) renderOptions();
  };

  //

  // ---------------------------------
  // HANDLER
  // ---------------------------------
  const setIsDisabled = (value: boolean) => {
    state.isDisabled = value;
    elm.root.dataset.disabled = String(state.isDisabled);
  };

  const open = () => {
    if (state.isDisabled) return;
    if (state.isOpen) return;
    state.isOpen = true;
    onOpenChange(true);
    elm.dropdown.style.removeProperty('display');
    elm.root.dataset.open = 'true';
    elm.buttonContainer.dataset.open = 'true';
    elm.button.setAttribute('aria-expanded', 'true');
    filterAndRenderOptions('');

    let selectedElement: null | Element = null;
    if (isMultiple) {
      if (state.selectedOptions.size) {
        selectedElement = elm.optionsContainer.querySelector('[data-selected="1"]');
      }
    } else {
      state.activeIndex = state.filteredOptionsFlat.findIndex(
        (option) => option === state.selectedOption
      );
      if (state.selectedOption) {
        selectedElement = elm.optionsContainer.querySelector('[data-selected="1"]');
      }
    }
    if (selectedElement) selectedElement.scrollIntoView({ block: 'center' });
    else elm.optionsContainer.scrollTop = 0;

    if (enableSearch) elm.searchInput.focus();
  };

  const close = () => {
    if (!state.isOpen) return;
    state.isOpen = false;
    onOpenChange(false);
    state.activeIndex = -1;
    elm.dropdown.style.display = 'none';
    elm.root.dataset.open = 'false';
    elm.buttonContainer.dataset.open = 'false';
    elm.button.setAttribute('aria-expanded', 'false');
    elm.searchInput.value = '';
    elm.optionsContainer.innerHTML = '';
  };

  const toggle = () => {
    if (state.isOpen) close();
    else open();
  };

  const updateButton = () => {
    const updateProps = (hasValue: number) => {
      if (hasValue) {
        elm.deselectButton.style.removeProperty('display');
        elm.buttonContainer.dataset.hasValue = 'true';
        elm.dropdown.dataset.hasValue = 'true';
      } else {
        $.append(elm.button, [placeholder]);
        elm.deselectButton.style.display = 'none';
        elm.buttonContainer.dataset.hasValue = 'false';
        elm.dropdown.dataset.hasValue = 'false';
      }
    };
    elm.button.innerHTML = '';
    if (isMultiple) {
      if (state.selectedOptions.size === 0) {
        updateProps(0);
      } else {
        $.append(elm.button, [triggerButton(state.selectedOptions)]);
        updateProps(1);
      }
    } else {
      if (state.selectedOption === null) {
        updateProps(0);
      } else {
        $.append(elm.button, [triggerButton(state.selectedOption)]);
        updateProps(1);
      }
    }
  };

  const filterAndRenderOptions = (query = '') => {
    const search = query.toLowerCase();
    state.filteredOptionsFlat = [];
    state.filteredOptions = data.reduce<Array<{ groupName: string; options: TOption[] }>>(
      (acc, group) => {
        const options = group.options.filter((option) => isVisibleFn(option, search));
        if (options.length) {
          acc.push({ groupName: group.groupName, options });
          state.filteredOptionsFlat.push(...options);
        }
        return acc;
      },
      []
    );
    state.activeIndex = -1; // Reset active index when typing
    renderOptions();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveFocus(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveFocus(-1);
    } else if (e.key === 'Enter' && state.activeIndex > -1) {
      e.preventDefault();
      if (isMultiple) {
        toggleValue(state.filteredOptionsFlat[state.activeIndex]);
      } else {
        setValue(state.filteredOptionsFlat[state.activeIndex]);
        close();
        elm.button.focus();
      }
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      e.preventDefault();
      close();
      elm.button.focus();
    }
  };

  const moveFocus = (direction: number) => {
    let newIndex = state.activeIndex + direction;
    while (
      newIndex >= 0 &&
      newIndex < state.filteredOptionsFlat.length &&
      isDisabledFn(state.filteredOptionsFlat[newIndex], state.selectedOption)
    ) {
      newIndex += direction;
    }
    if (newIndex >= 0 && newIndex < state.filteredOptionsFlat.length) {
      state.activeIndex = newIndex;
      updateActiveDescendant();
    }
  };

  const updateActiveDescendant = () => {
    const optionsElements = elm.optionsContainer.querySelectorAll('[role=option]');
    optionsElements.forEach(($option, index) => {
      $option.className = [
        className.optionItem,
        state.filteredOptionsFlat[index] === state.selectedOption && className.optionSelected,
        index === state.activeIndex && className.optionHighlighted,
      ]
        .filter(Boolean)
        .join(' ');
      if (index === state.activeIndex) {
        $option.setAttribute('aria-selected', 'true');
        $option.scrollIntoView({ block: 'nearest' });
        elm.searchInput.setAttribute('aria-activedescendant', $option.id);
      } else {
        $option.setAttribute('aria-selected', 'false');
      }
    });
  };

  const renderOptions = () => {
    elm.optionsContainer.innerHTML = '';

    if (state.filteredOptionsFlat.length === 0) {
      $.append(elm.optionsContainer, [
        $.append($('li', { className: className.noResult }), [noResult]),
      ]);
      return;
    }

    console.info('Here22');
    // return;

    state.filteredOptions.forEach((group, groupIndex) => {
      $.append(elm.optionsContainer, [
        $('li', {
          textContent: group.groupName,
          className: className.optionGroup,
        }),
      ]);
      group.options.forEach((option, optionIndex) => {
        const isSelected = isMultiple
          ? state.selectedOptions.has(option)
          : option === state.selectedOption;
        const isDisabled = isDisabledFn(option, state.selectedOption);
        const $option = $(
          'li',
          {
            role: 'option',
            'aria-selected': 'false', // Highlighted
            'aria-disabled': isDisabled ? 'true' : undefined,
            id: `option-${uniqueId}--${groupIndex}.${optionIndex}`,
            className: [className.optionItem, isSelected && className.optionSelected]
              .filter(Boolean)
              .join(' '),
          },
          {
            click: () => {
              if (!isDisabled) {
                if (isMultiple) {
                  console.info('Here');
                  toggleValue(option);
                } else {
                  setValue(option as any);
                  close();
                  elm.button.focus();
                }
              }
            },
          }
        );
        if (isSelected) $option.dataset.selected = '1';
        $.append(elm.optionsContainer, [
          $.append($option, [getOptionLabel(option, { isSelected, isDisabled })]),
        ]);
      });
    });
  };

  //

  // ---------------------------------
  // ELEMENTS
  // ---------------------------------

  let elm = {
    root: document.querySelector(container) as HTMLDivElement,

    buttonContainer: $('div', {
      className: className.buttonContainer,
      data: { open: false, hasValue: false },
    }),

    button: $(
      'button',
      {
        className: className.triggerButton,
        type: 'button',
        'aria-haspopup': 'listbox',
        'aria-expanded': 'false',
        'aria-controls': 'custom-select-options',
      },
      enableSearch
        ? {
            click: toggle,
          }
        : {
            click: toggle,
            keydown: (e: Event) => {
              if (state.isOpen) {
                handleKeyDown(e as KeyboardEvent);
              }
            },
          }
    ),

    deselectButton: $(
      'button',
      {
        className: className.deselectButton,
        type: 'button',
        style: 'display: none',
        'aria-label': 'Deselect option',
      },
      {
        click: () => {
          if (state.isDisabled) return;
          resetValue();
          elm.button.focus();
        },
      }
    ),

    dropdown: $('div', {
      className: className.dropdownContainer,
      style: 'display: none',
      data: { hasValue: false },
    }),

    searchInput: $(
      'input',
      {
        className: className.searchInput,
        type: 'text',
        placeholder: searchPlaceholder,
        role: 'textbox',
        'aria-autocomplete': 'list',
        'aria-controls': 'custom-select-options',
        spellcheck: false,
      },
      {
        input: (e: Event) => filterAndRenderOptions((e.target as HTMLInputElement).value),
        keydown: (e: Event) => handleKeyDown(e as KeyboardEvent),
      }
    ),

    optionsContainer: $('ul', {
      className: className.optionsContainer,
      role: 'listbox',
    }),
  };

  const containerClassNames = (className.container || '').split(' ').filter(Boolean);
  if (containerClassNames.length) elm.root.classList.add(...containerClassNames);
  elm.root.dataset.open = 'false';
  elm.root.dataset.disabled = String(isDisabled);

  if (!enableSearch) elm.searchInput.style.display = 'none';

  $.append(elm.root, [
    $.append(elm.buttonContainer, [
      $.append(elm.button, [placeholder]),
      $.append(elm.deselectButton, [deselectButton]),
    ]),
    $.append(elm.dropdown, [
      helpText ? $.append($('div', { className: className.helpText }), [helpText]) : undefined,
      elm.searchInput,
      elm.optionsContainer,
    ]),
  ]);

  function handleClickOutside(e: MouseEvent) {
    if (!elm.button.contains(e.target as Node) && !elm.dropdown.contains(e.target as Node)) {
      close();
    }
  }
  document.addEventListener('click', handleClickOutside);

  //

  // ---------------------------------
  // RETURN
  // ---------------------------------

  return {
    open,
    close,
    toggle,
    getValue: (isMultiple
      ? () => state.selectedOptions
      : () => state.selectedOption) as TMultiple extends true ? () => Set<TOption> : () => TOption,
    setValue: (isMultiple
      ? setValueForMultiple
      : setValueWithOptionChecking) as TMultiple extends true
      ? (selectedOptions: TOption[] | ((options: TOption[]) => TOption[])) => void
      : (selectedOption: TOption | null | ((options: TOption[]) => TOption | null)) => void,
    resetValue,
    setIsDisabled,
    element: elm,
    destroy: () => {
      document.removeEventListener('click', handleClickOutside);
      elm.optionsContainer.innerHTML = '';
      elm.root.innerHTML = '';
      elm = undefined as any;
      state = undefined as any;
    },
  };
}
