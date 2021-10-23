using System.Collections.Generic;

namespace GuessNationality.Models
{
    public class Game
    {
        public string User { get; set; }
        public List<Person> List { get; set; }
        public Person Person { get; set; }
        public int Score { get; set; }
        public int Current { get; set; }
        public int Total { get; set; }
    }
}
