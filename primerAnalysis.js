// Function to assess both forward and reverse primers
function assessPrimers() {
    const primersInput = document.getElementById("primerSeq").value;
    const targetSeq = document.getElementById("targetSeq").value;

    if (!primersInput) {
        alert("Please enter both forward and reverse primers.");
        return;
    }

    // Split input primers by comma
    const primers = primersInput.split(',');

    // Ensure both forward and reverse primers are entered
    if (primers.length !== 2) {
        alert("Please provide both forward and reverse primers separated by a comma.");
        return;
    }

    const forwardPrimer = primers[0].trim();
    const reversePrimer = primers[1].trim();

    // Assess melting temperature (Tm)
    let forwardTm = calculateTm(forwardPrimer);
    let reverseTm = calculateTm(reversePrimer);

    // Calculate common annealing temperature (Ta)
    let commonTa = Math.min(forwardTm, reverseTm) - 3; // Common Ta

    // Assess forward primer results
    let forwardResults = assessSinglePrimer(forwardPrimer, targetSeq, forwardTm, commonTa, "Forward Primer");

    // Assess reverse primer results
    let reverseResults = assessSinglePrimer(reversePrimer, targetSeq, reverseTm, commonTa, "Reverse Primer");

    // Check for heterodimers between forward and reverse primers
    let heteroDimer = checkDimer(forwardPrimer, reversePrimer);

    // Analyze target sequence
    let targetBinding = "";
    if (targetSeq) {
        targetBinding = analyzeTargetBinding(forwardPrimer, reversePrimer, targetSeq);
    }

    // Get usability explanation
    let explanation = primerUsability(forwardPrimer, reversePrimer, forwardTm, reverseTm, commonTa, heteroDimer, targetSeq);

    // Display results
    document.getElementById("results").innerHTML = `
        <h4>Forward Primer Results:</h4>
        ${forwardResults}<br>
        <h4>Reverse Primer Results:</h4>
        ${reverseResults}<br>
        <h4>Common Annealing Temperature (Ta):</h4> ${commonTa}°C<br>
        <h4>Heterodimer Formation:</h4> ${heteroDimer ? "Yes" : "No"}<br>
        <h4>Target Sequence Analysis:</h4> ${targetBinding}<br>
        <h4>Primer Usability Explanation:</h4> ${explanation}
    `;
}

// Function to assess a single primer
function assessSinglePrimer(primerSeq, targetSeq, tm, commonTa, primerType) {
    // Calculate GC content
    let gcCount = (primerSeq.match(/G/g) || []).length + (primerSeq.match(/C/g) || []).length;
    let totalNucleotides = primerSeq.length;
    let gcContent = (gcCount / totalNucleotides) * 100;

    // Check for hairpins
    let hairpin = checkHairpin(primerSeq);

    // Check for self-dimers
    let selfDimer = checkDimer(primerSeq, primerSeq);

    // Check binding specificity with target sequence (optional)
    let bindingInfo = "";
    if (targetSeq) {
        bindingInfo = checkBinding(primerSeq, targetSeq);
    }

    // Calculate percent probability of functionality (including self-dimers and hairpins)
    let probability = calculateFunctionalityProbability(gcContent, tm, totalNucleotides, hairpin, selfDimer);

    return `
        <b>Melting Temperature (Tm):</b> ${tm}°C<br>
        <b>Annealing Temperature (Ta):</b> ${commonTa}°C<br>
        <b>GC Content:</b> ${gcContent.toFixed(2)}%<br>
        <b>Hairpin Formation:</b> ${hairpin ? "Yes" : "No"}<br>
        <b>Self-Dimer Formation:</b> ${selfDimer ? "Yes" : "No"}<br>
        <b>Percent Probability of Functionality:</b> ${probability.toFixed(2)}%
        ${bindingInfo}
    `;
}

// Function to analyze target sequence binding with primers
function analyzeTargetBinding(forwardPrimer, reversePrimer, targetSeq) {
    const forwardBindingPos = targetSeq.toUpperCase().indexOf(forwardPrimer.toUpperCase());
    const reverseBindingPos = targetSeq.toUpperCase().indexOf(reversePrimer.toUpperCase());

    return `
        <b>Forward Primer Binding Position:</b> ${forwardBindingPos !== -1 ? forwardBindingPos : "Not found"}<br>
        <b>Reverse Primer Binding Position:</b> ${reverseBindingPos !== -1 ? reverseBindingPos : "Not found"}<br>
    `;
}

// Function to check primer binding in target sequence
function checkBinding(primerSeq, targetSeq) {
    const primerPos = targetSeq.toUpperCase().indexOf(primerSeq.toUpperCase());
    return primerPos !== -1 ? `<b>Binding Position:</b> ${primerPos}<br>` : `<b>Binding Position:</b> Not found<br>`;
}

// Function to calculate melting temperature (Tm)
function calculateTm(primer) {
    let gcCount = (primer.match(/G/g) || []).length + (primer.match(/C/g) || []).length;
    let atCount = (primer.match(/A/g) || []).length + (primer.match(/T/g) || []).length;
    return 4 * gcCount + 2 * atCount; // Basic formula for Tm calculation
}

// Function to check for dimers (both self and heterodimers)
function checkDimer(primer1, primer2) {
    let reverseComplement = primer2.split('').reverse().map(base => {
        switch (base) {
            case 'A': return 'T';
            case 'T': return 'A';
            case 'G': return 'C';
            case 'C': return 'G';
            default: return base;
        }
    }).join('');

    return primer1.includes(reverseComplement);
}

// Function to check for hairpin formation (simple version)
function checkHairpin(primer) {
    let reverseComplement = primer.split('').reverse().map(base => {
        switch (base) {
            case 'A': return 'T';
            case 'T': return 'A';
            case 'G': return 'C';
            case 'C': return 'G';
            default: return base;
        }
    }).join('');

    return primer.includes(reverseComplement.substring(0, Math.floor(primer.length / 2)));
}

// Function to calculate percent probability of functionality
function calculateFunctionalityProbability(gcContent, tm, length, hairpin, selfDimer) {
    let score = 0;

    // GC Content Score (Max 30 points)
    if (gcContent >= 40 && gcContent <= 60) {
        score += 30;
    } else if (gcContent >= 35 && gcContent <= 65) {
        score += 20;
    } else {
        score += 10;
    }

    // Melting Temperature Score (Max 30 points)
    if (tm >= 50 && tm <= 60) {
        score += 30;
    } else if (tm >= 45 && tm <= 65) {
        score += 20;
    } else {
        score += 10;
    }

    // Hairpin Formation Score (Max 20 points)
    if (!hairpin) {
        score += 20;
    } else {
        score += 0;  // No points for hairpin formation
    }

    // Self-Dimer Formation Score (Max 20 points)
    if (!selfDimer) {
        score += 20;
    } else {
        score -= 20;  // Penalize for self-dimers
    }

    // Length Score (Max 20 points)
    if (length >= 18 && length <= 20) {
        score += 20;
    } else if (length >= 15 && length <= 25) {
        score += 10;
    } else {
        score += 0;
    }

    // Calculate percentage
    let totalScore = score > 100 ? 100 : score;  // Cap at 100%
    return totalScore;
}

// Function to explain primer usability based on results
function primerUsability(forwardPrimer, reversePrimer, forwardTm, reverseTm, commonTa, heteroDimer, targetSeq) {
    let explanation = "The primers ";
    let issues = [];

    // Check primer binding positions if target sequence is provided
    if (targetSeq) {
        const forwardBindingPos = targetSeq.toUpperCase().indexOf(forwardPrimer.toUpperCase());
        const reverseBindingPos = targetSeq.toUpperCase().indexOf(reversePrimer.toUpperCase());

        if (forwardBindingPos === -1 || reverseBindingPos === -1) {
            explanation += "cannot be used because they do not bind to the target sequence.";
        } else {
            // Check Tm difference and dimer formation
            if (Math.abs(forwardTm - reverseTm) > 5) {
                issues.push("Tm difference > 5°C");
            }

            if (heteroDimer) {
                issues.push("heterodimer formation");
            }

            if (issues.length > 0) {
                explanation += "cannot be used due to the following issues: " + issues.join(", ") + ".";
            } else {
                explanation += "are usable with optimal Tm and Ta, no significant hairpin or dimer formation.";
            }
        }
    } else {
        // If no target sequence provided, just check Tm and dimer formation
        if (Math.abs(forwardTm - reverseTm) > 5) {
            issues.push("Tm difference > 5°C");
        }

        if (heteroDimer) {
            issues.push("heterodimer formation");
        }

        if (issues.length > 0) {
            explanation += "cannot be used due to the following issues: " + issues.join(", ") + ".";
        } else {
            explanation += "are usable with optimal Tm and Ta, no significant hairpin or dimer formation.";
        }
    }

    return explanation;
}

// Function to clear inputs and results
function reloadPage() {
    document.getElementById("primerSeq").value = "";
    document.getElementById("targetSeq").value = "";
    document.getElementById("results").innerHTML = "";
}
