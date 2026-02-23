/**
 * @fileOverview Instant library of common real estate objections.
 * Pre-generated responses in Monica's voice to ensure sub-second performance.
 */

export interface ObjectionResponse {
  objection: string;
  empathy: string;
  response: string;
  redirect: string;
  avoid: string;
}

export const OBJECTION_LIBRARY: Record<string, ObjectionResponse[]> = {
  expired: [
    {
      objection: "You're the 50th agent to call me today.",
      empathy: "I can only imagine how frustrating that is. Honestly, if I were in your shoes, I’d probably be screening my calls too.",
      response: "The reason your phone is ringing is because your home is actually a great property—the market just didn't see the right value in how it was positioned last time. Most agents are calling to ask for a listing; I'm calling because I have a specific strategy to stop the calls and actually get the house moved.",
      redirect: "Besides the frustration of the phone calls, what was the biggest challenge you had with the previous listing process?",
      avoid: "Don't apologize for calling or say 'I'm different' without explaining how."
    },
    {
      objection: "We're going to take it off the market for a while.",
      empathy: "I completely understand needing a breather. The listing process can be exhausting when it doesn't result in a sale.",
      response: "Taking a break is one option, but usually, that just delays your goals. In the Las Vegas market, 'waiting' often means competing with more inventory later. I’d like to show you exactly why it didn't sell so we can fix the 'invisible' barriers now while buyer demand is still concentrated.",
      redirect: "If we could have a solid offer on your desk in the next 21 days at a price you liked, would you still want to wait?",
      avoid: "Don't tell them they are making a mistake. Validate the feeling, then pivot to the goal."
    }
  ],
  fsbo: [
    {
      objection: "I want to save the commission.",
      empathy: "I totally get that. If I could save 3% or 6% just by doing a bit of extra work myself, I'd consider it too.",
      response: "The reality is that buyers look at FSBOs because they expect a discount. They aren't trying to save you money; they're trying to save themselves money. My goal isn't just to list your home, it's to net you more money even after my fee is paid, by creating a bidding environment that you simply can't get without full market exposure.",
      redirect: "If I could show you a way to net 5% more on your bottom line than you could on your own, would you be open to a 10-minute chat?",
      avoid: "Don't argue about the math. Show the value of the 'net' result."
    }
  ],
  general: [
    {
      objection: "Will you cut your commission?",
      empathy: "I appreciate you being direct. Everyone wants to make sure they are getting the best value.",
      response: "I don't cut my commission for one simple reason: If an agent can't even defend their own value in a negotiation with you, how on earth are they going to defend your equity when a tough buyer's agent starts beating them up on price? You want a shark in your corner, not someone who folds at the first sign of pressure.",
      redirect: "Is the commission the only thing holding you back from moving forward, or is there something else about my strategy you're unsure of?",
      avoid: "Never say 'let me check with my broker.' It makes you look weak."
    },
    {
      objection: "Another agent said they could get me $50k more.",
      empathy: "That sounds like an amazing number. I wish I could tell you that was the reality today.",
      response: "Any agent can tell you a high price to buy your listing, but they can't 'buy' the buyer. In Nevada, buyers are educated. If we overprice it, the home sits, becomes 'stale,' and we eventually sell for less than if we'd priced it right. I’m interested in telling you the truth that gets you moved, not a fairy tale that leaves you stuck.",
      redirect: "Do you want an agent who tells you what you want to hear, or one who tells you what it takes to actually get the check at closing?",
      avoid: "Don't trash the other agent. Trash the strategy of 'buying a listing'."
    }
  ]
};
