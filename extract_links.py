import re
import sys

def extract_links(input_file, output_file):
    # Відкриваємо вхідний файл для зчитування
    with open(input_file, 'r', encoding='utf-8') as f:
        text = f.read()
    
    # Знаходимо усі URL-посилання за допомогою регулярного виразу
    # Цей вираз шукає посилання, що починаються з http:// або https://
    url_pattern = re.compile(r'https?://[^\s<>"\']+|www\.[^\s<>"\']+')
    all_links = url_pattern.findall(text)
    
    # Фільтруємо посилання, щоб залишити тільки ті, які містять "/posts/"
    filtered_links = [link for link in all_links if "/posts/" in link]
    
    # Записуємо знайдені посилання в вихідний файл
    with open(output_file, 'w', encoding='utf-8') as f:
        for link in filtered_links:
            f.write(link + '\n')
    
    print(f"Знайдено {len(all_links)} посилань, з них {len(filtered_links)} містять '/posts/'. Збережено у файлі {output_file}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Використання: python extract_links.py <вхідний_файл> <вихідний_файл>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    extract_links(input_file, output_file) 