const fs = require('fs');
let code = fs.readFileSync('c:/laragon/www/KOSPART PH 18/resources/js/Components/CanteenTab.jsx', 'utf8');

const replacements = [
    { startStr: '{showAddItemModal && (', endStr: '                {/* Modal Manual Order */}' },
    { startStr: '{showManualOrderModal && (', endStr: '                {/* Checkout Modal */}' },
    { startStr: '{checkoutModal && (', endStr: '            {/* Pay Debt Modal */}' },
    { startStr: '{showPayDebtModal && (', endStr: '            {/* Item Info Modal */}' },
    { startStr: '{selectedItemInfo && (', endStr: '            {/* Limit Warning Modal */}' }
];

replacements.forEach(({startStr, endStr}) => {
    let startIdx = code.indexOf(startStr);
    let endIdx = code.indexOf(endStr, startIdx);
    if (startIdx !== -1 && endIdx !== -1) {
        let block = code.substring(startIdx, endIdx);
        // find the first '<div className="fixed inset-0'
        block = block.replace('<div className="fixed inset-0', '<Portal>\n                    <div className="fixed inset-0');
        // find the last ')}' before the endStr
        let lastParenthesis = block.lastIndexOf(')}');
        if (lastParenthesis !== -1) {
            block = block.substring(0, lastParenthesis) + '</Portal>\n                )}' + block.substring(lastParenthesis + 2);
        }
        code = code.substring(0, startIdx) + block + code.substring(endIdx);
    }
});

fs.writeFileSync('c:/laragon/www/KOSPART PH 18/resources/js/Components/CanteenTab.jsx', code);
console.log('Modals wrapped successfully!');
