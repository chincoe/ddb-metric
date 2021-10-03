const parenthesesRegex = /((?:a|[^a])*?\()([0-9/]+)(\s*(?:ft|oz|lbs|feet))(?! \([0-9./]+ ?(?:m|g|kg)\)| \| [0-9./]+ ?(?:m|g|kg))(.*?\)(?:a|[^a])*?)/ig
const rangeRegex = /((?:a|[^a])*?Range \()([0-9/]+)()(?! | [0-9/]+)(\)(?:a|[^a])*?)/ig
const regularRegex = /((?:a|[^a])*?)([0-9/]+)(\s*(?:ft|oz|lbs|feet))(?! \([0-9./]+ ?(?:m|g|kg)\)| \| [0-9./]+ ?(?:m|g|kg))((?:a|[^a])*?)/ig

const globalValues = {
    interval: 0,
    checkedNodes: []
}

const replaceUnits = () => {
    chrome.storage.sync.get(['scale', 'replace'], async ({ scale = '1.5', replace = false }) => {
        function round(value) {
            return Math.round(value * 10) / 10;
        }

        function convertImperialToMetric(pValue = '', pUnit = '') {
            const unit = pUnit.trim();
            if (pValue.includes('/')) {
                const [v1, v2] = pValue.split('/').filter(v => !!v);
                switch (unit) {
                    case 'ft':
                        return `${round((v1 / 5) * scale)}/${round((v2 / 5) * scale)} m`;
                    case 'ranged_ft':
                        return `${round((v1 / 5) * scale)}/${round((v2 / 5) * scale)}m`;
                    default:
                        return null;
                }
            } else {
                const value = Number(pValue);
                switch (unit) {
                    case 'feet':
                    case 'ft':
                        return `${round((value / 5) * scale)} m`;
                    case 'oz':
                        return `${round(value * 28.3)} g`
                    case 'lbs':
                        return `${round(value / 2.205)} kg`
                    default:
                        return null;
                }
            }

        }

        let didReplace = false;

        const nodes = Array.from(document.body.querySelectorAll('*'))
            .filter(n => !!n
                && !['IFRAME', 'STYLE', 'BR', 'SCRIPT', 'NOSCRIPT', 'IMG', 'NAV'].includes(n.tagName)
                && (!n.children || !Array.from(n.children)
                    .filter(n => !['I', 'IMG', 'SPAN', 'EM', 'STRONG', 'A'].includes(n.tagName)).length)
                && n.innerText
                && n.innerHTML
                && n.innerHTML.length < 1000
                &&
                (regularRegex.test(n.innerHTML) || parenthesesRegex.test(n.innerHTML) || rangeRegex.test(n.innerHTML))
            );
        nodes.reverse();
        for (let i = 0; i <= nodes.length; ++i) {
            const node = nodes[i];
            if (!node) continue;
            didReplace = true;
            if (rangeRegex.test(node.innerHTML)) {
                console.log('ranged', node.innerHTML)
                node.innerHTML = node.innerHTML.replace(
                    rangeRegex,
                    (fullMatch, prefix, value, _, suffix) => {
                        if (value) {
                            const metricValue = convertImperialToMetric(value, 'ranged_ft');
                            if (metricValue) {
                                return replace ? `${prefix}${metricValue}${suffix}` : `${prefix}${value} | ${metricValue}${suffix}`;
                            }
                        }
                        return fullMatch;
                    }
                )
            } else if (replace) {
                node.innerHTML = node.innerHTML.replace(
                    regularRegex,
                    (fullMatch, prefix, value, unit, suffix) => {
                        if (value && unit) {
                            const metricValue = convertImperialToMetric(value, unit);
                            if (metricValue) {
                                return `${prefix}${metricValue}${suffix}`;
                            }
                        }
                        return fullMatch;
                    }
                )
            } else if (parenthesesRegex.test(node.innerHTML)) {
                node.innerHTML = node.innerHTML.replace(
                    parenthesesRegex,
                    (fullMatch, prefix, value, unit, suffix) => {
                        if (value && unit) {
                            const metricValue = convertImperialToMetric(value, unit);
                            if (metricValue) {
                                return `${prefix}${value}${unit} | ${metricValue}${suffix}`;
                            }
                        }
                        return fullMatch;
                    }
                )
            } else if (regularRegex.test(node.innerHTML)) {
                node.innerHTML = node.innerHTML.replace(
                    regularRegex,
                    (fullMatch, prefix, value, unit, suffix) => {
                        if (value && unit) {
                            const metricValue = convertImperialToMetric(value, unit);
                            if (metricValue) {
                                return `${prefix}${value}${unit} (${metricValue})${suffix}`
                            }
                        }
                        return fullMatch;
                    }
                )
            }
        }

        if (!didReplace) {
            clearInterval(globalValues.interval);
            globalValues.interval = setInterval(replaceUnits, 2000);
        }
    });
}

globalValues.interval = setInterval(replaceUnits, 500);




